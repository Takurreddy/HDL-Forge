"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  fetchLearningPaths,
  fetchLearningProgress,
  fetchLearningRecommendations,
  fetchConceptMastery,
  fetchProblems,
} from "@/lib/api";
import {
  LearningPathSummary,
  LearningProgressData,
  LearningRecommendations,
  ConceptMastery,
  Problem,
} from "@/lib/types";
import {
  BookOpen,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Swords,
  Compass,
  GraduationCap,
  Cpu,
  ShieldCheck,
  Zap,
  Clock,
  Layers,
  CheckCircle2,
  Lock,
  ExternalLink,
  Flame,
  Award,
  Binary,
  Code2,
} from "lucide-react";
import DifficultyBadge from "@/components/DifficultyBadge";

type LearnSection = "library" | "quest" | "explore" | "study-plan";

interface ConceptCard {
  id: string;
  title: string;
  category: string;
  role: string;
  difficulty: "easy" | "medium" | "hard";
  summary: string;
  formula?: string;
  keyTakeaway: string;
  relatedProblemSlugs: string[];
}

const HARDWARE_CONCEPTS: ConceptCard[] = [
  {
    id: "setup-hold-sta",
    title: "Setup & Hold Static Timing Analysis (STA)",
    category: "Timing & Physical Design",
    role: "FPGA & Silicon Architecture",
    difficulty: "medium",
    summary:
      "Digital registers require input data to be stable before the clock edge (Setup time Tsu) and remain stable after the clock edge (Hold time Th). Violating these creates metastability where the flip-flop output lingers between 0 and 1.",
    formula:
      "T_clk >= T_cq + T_comb_max + T_setup - T_skew\nT_cq + T_comb_min >= T_hold + T_skew",
    keyTakeaway:
      "Setup violations are resolved by lowering frequency or pipelining. Hold violations are fatal and independent of clock frequency; they must be fixed with delay buffers.",
    relatedProblemSlugs: ["d-flip-flop", "edge-detector", "4-bit-counter"],
  },
  {
    id: "clock-domain-crossing",
    title: "Clock Domain Crossing (CDC) & Gray Coding",
    category: "Asynchronous Design",
    role: "ASIC Verification (DV)",
    difficulty: "hard",
    summary:
      "When signals transition between asynchronous clock domains, single-bit signals use a two-flop synchronizer (2-FF). Multi-bit buses cannot use 2-FF directly due to bus skew causing transient invalid states. Multi-bit pointers must use Gray code where only 1 bit toggles per cycle.",
    formula:
      "Gray = Binary ^ (Binary >> 1)\nMTBF = e^(s * tau) / (T0 * f_clk * f_data)",
    keyTakeaway:
      "Dual-clock asynchronous FIFOs convert write/read pointers to Gray code before crossing clock domains to guarantee zero multi-bit hazard states.",
    relatedProblemSlugs: ["gray-code-converter", "sync-fifo"],
  },
  {
    id: "fsm-encoding-tradeoffs",
    title: "Finite State Machine (FSM) Encoding Trade-offs",
    category: "Sequential Logic",
    role: "RTL Design Engineer",
    difficulty: "medium",
    summary:
      "FSM state register encoding dictates power, area, and speed. Binary encoding uses ceil(log2(N)) flops with deeper combinational next-state decoding. One-Hot encoding uses N flops with simple 1-gate next-state logic, ideal for high-speed FPGAs.",
    formula:
      "Binary flops = ceil(log2(N))\nOne-Hot flops = N (Zero combinational decoding delay)",
    keyTakeaway:
      "Use One-Hot encoding for FPGAs where flip-flops are abundant to maximize Fmax. Use Gray/Binary encoding in low-power ASICs to minimize toggle energy.",
    relatedProblemSlugs: ["traffic-light-fsm", "edge-detector"],
  },
  {
    id: "arithmetic-architectures",
    title: "High-Speed Arithmetic Architectures & Carry Lookahead",
    category: "Datapath Arithmetic",
    role: "RTL Design Engineer",
    difficulty: "medium",
    summary:
      "Ripple-carry adders suffer from O(N) carry propagation delay where carry ripples bit-by-bit from LSB to MSB. Carry-Lookahead Adders (CLA) compute Generate (G = A & B) and Propagate (P = A ^ B) terms in parallel, reducing delay to O(log N).",
    formula:
      "G_i = A_i & B_i,  P_i = A_i ^ B_i\nC_i+1 = G_i | (P_i & C_i)",
    keyTakeaway:
      "For wide datapaths (32-bit/64-bit), Han-Carlson, Brent-Kung, and Kogge-Stone prefix adders achieve logarithmic gate depth critical for meeting 2GHz+ CPU targets.",
    relatedProblemSlugs: [
      "half-adder",
      "full-adder",
      "chip-adder-4bit",
      "adder-subtractor-4bit",
      "4-bit-alu",
    ],
  },
  {
    id: "flow-control-handshakes",
    title: "Valid/Ready Flow Control & Skid Buffering",
    category: "Bus Protocols & Interconnect",
    role: "ASIC Verification (DV)",
    difficulty: "hard",
    summary:
      "AXI-Stream, TileLink, and Wishbone protocols use Valid/Ready handshakes for backpressure. A transfer occurs only when (Valid && Ready) is high on the rising clock edge. Naive ready combinations create long combinational feedback paths; Skid Buffers decouple timing.",
    formula:
      "Transfer = Valid && Ready\nFull = (write_ptr == read_ptr) && (write_lap != read_lap)",
    keyTakeaway:
      "Never make Valid combinatorially dependent on Ready (causes deadlocks). Skid buffers break combinatorial timing paths on the Ready backpressure path.",
    relatedProblemSlugs: ["sync-fifo", "4-bit-alu"],
  },
  {
    id: "prbs-lfsr-verification",
    title: "LFSRs & Pseudo-Random Stimulus Generation",
    category: "Design For Test (DFT) & DV",
    role: "ASIC Verification (DV)",
    difficulty: "medium",
    summary:
      "Linear Feedback Shift Registers generate maximal-length pseudo-random binary sequences (PRBS 2^N - 1 states) using primitive polynomials. Used in Built-In Self-Test (BIST), CRC calculation, and constrained-random hardware verification stimulus.",
    formula:
      "Feedback = ~(q[taps[0]] ^ q[taps[1]] ^ ...)\nCycle Length = 2^N - 1",
    keyTakeaway:
      "Fibonacci LFSRs have feedback tapped into the MSB; Galois LFSRs apply XOR gates inline between registers, offering lower clock-to-out delay for high-frequency testing.",
    relatedProblemSlugs: ["lfsr-8bit", "leading-zero-counter"],
  },
  {
    id: "priority-arbiter-trees",
    title: "Priority Encoders & Round-Robin Arbiters",
    category: "Interconnect & Arbitration",
    role: "RTL Design Engineer",
    difficulty: "easy",
    summary:
      "Priority encoders identify the most significant active request bit in an incoming vector. Fixed-priority creates starvation for lower-order requesters, so high-performance SoC routers use rotating mask round-robin arbiters.",
    formula:
      "Grant = Req & ~(Req - 1)  // Lowest active bit grant\nValid = |Req",
    keyTakeaway:
      "Synthesizing priority logic with casez creates a cascaded multiplexer chain. Using parallel prefix borrow chains reduces logic depth from O(N) to O(log2 N).",
    relatedProblemSlugs: ["priority-encoder-8to3", "leading-zero-counter"],
  },
];

interface RoleQuest {
  role: string;
  icon: typeof Cpu;
  badgeColor: string;
  tagline: string;
  description: string;
  totalXp: number;
  stages: {
    stage: number;
    title: string;
    concept: string;
    problemSlugs: string[];
  }[];
}

const ROLE_QUESTS: RoleQuest[] = [
  {
    role: "RTL Design Engineer (ASIC / SoC)",
    icon: Cpu,
    badgeColor: "bg-accent/15 text-accent border-accent/40",
    tagline: "Master synthesizable SystemVerilog, datapath microarchitecture, and timing closure",
    description:
      "From basic logic gates to multi-module chip architectures, learn how industry RTL teams at NVIDIA, Apple, and Intel design production silicon.",
    totalXp: 1850,
    stages: [
      {
        stage: 1,
        title: "Digital Logic & MUX Trees",
        concept: "Combinational logic, K-Maps, gate-level vs behavioral RTL",
        problemSlugs: ["and-gate", "or-gate", "2-to-1-mux", "chip-mux-4to1"],
      },
      {
        stage: 2,
        title: "High-Performance Arithmetic",
        concept: "Adders, 2's complement subtractors, carry propagate/generate",
        problemSlugs: [
          "half-adder",
          "full-adder",
          "chip-adder-4bit",
          "adder-subtractor-4bit",
          "4-bit-alu",
        ],
      },
      {
        stage: 3,
        title: "Sequential Datapaths & Arbitration",
        concept: "Pipelined registers, priority encoders, leading zero counters",
        problemSlugs: [
          "d-flip-flop",
          "4-bit-counter",
          "priority-encoder-8to3",
          "leading-zero-counter",
        ],
      },
      {
        stage: 4,
        title: "Complex FSMs & Buffering",
        concept: "Moore/Mealy state machines, circular FIFO queues, flow control",
        problemSlugs: ["traffic-light-fsm", "sync-fifo", "binary-to-bcd"],
      },
    ],
  },
  {
    role: "ASIC Verification Engineer (DV / UVM)",
    icon: ShieldCheck,
    badgeColor: "bg-[#00B8A3]/15 text-[#00B8A3] border-[#00B8A3]/40",
    tagline: "Constrained-random testbenches, assertions, coverage, and protocol verification",
    description:
      "Hardware bugs cost millions if tapeout occurs with flaws. Verification engineers build rigorous automated test harnesses that stress edge conditions.",
    totalXp: 1600,
    stages: [
      {
        stage: 1,
        title: "Self-Checking Testbench Fundamentals",
        concept: "Clock generation, task-based checking, non-blocking sampling",
        problemSlugs: ["and-gate", "xor-gate", "2-to-1-mux"],
      },
      {
        stage: 2,
        title: "Stimulus Generation & LFSR PRBS",
        concept: "Pseudo-random binary sequences, seed initialization, polynomial feedback",
        problemSlugs: ["lfsr-8bit", "4-bit-counter"],
      },
      {
        stage: 3,
        title: "Timing Corner Cases & Asynchronous Math",
        concept: "Gray code conversions, overflow detection, zero flags",
        problemSlugs: [
          "gray-code-converter",
          "adder-subtractor-4bit",
          "leading-zero-counter",
        ],
      },
      {
        stage: 4,
        title: "Protocol & FIFO Verification",
        concept: "Full/empty flag corner cases, watermarks, throughput verification",
        problemSlugs: ["sync-fifo", "traffic-light-fsm"],
      },
    ],
  },
  {
    role: "FPGA & Silicon Architecture Engineer",
    icon: Zap,
    badgeColor: "bg-warning/15 text-warning border-warning/40",
    tagline: "Static Timing Analysis (STA), Clock Domain Crossing, and FPGA DSP/BRAM primitives",
    description:
      "Bridge hardware logic with physical silicon constraints: meet 500MHz timing, manage asynchronous clocks, and optimize Look-Up Table (LUT) mapping.",
    totalXp: 1750,
    stages: [
      {
        stage: 1,
        title: "Combinational Propagation & Glitch Minimization",
        concept: "Gate propagation delays, hazard elimination, LUT-4/LUT-6 mapping",
        problemSlugs: ["half-adder", "full-adder", "2-to-1-mux"],
      },
      {
        stage: 2,
        title: "Edge Detection & Synchronization",
        concept: "1-cycle edge strobes, synchronous resets, metastability prevention",
        problemSlugs: ["d-flip-flop", "edge-detector", "lfsr-8bit"],
      },
      {
        stage: 3,
        title: "Hierarchical Standard Cell Composition",
        concept: "Floorplanning modular blocks, port mapping, modular chip parts",
        problemSlugs: ["chip-adder-4bit", "chip-mux-4to1"],
      },
      {
        stage: 4,
        title: "Asynchronous Clock Crossing & Arithmetic",
        concept: "Gray-coded FIFO read/write pointers, multi-clock domain pipelines",
        problemSlugs: ["gray-code-converter", "sync-fifo", "binary-to-bcd"],
      },
    ],
  },
];

interface StudyPlan {
  id: string;
  title: string;
  duration: string;
  targetCompany: string;
  badgeColor: string;
  description: string;
  problemCount: number;
  featuredSlugs: string[];
}

const STUDY_PLANS: StudyPlan[] = [
  {
    id: "top-hardware-75",
    title: "Top Hardware Interview 75",
    duration: "4 Weeks",
    targetCompany: "NVIDIA / Apple / Google / Intel",
    badgeColor: "bg-accent/15 text-accent border-accent/40",
    description:
      "The definitive collection of questions asked in Tier-1 silicon company hardware engineering technical interviews.",
    problemCount: 21,
    featuredSlugs: [
      "priority-encoder-8to3",
      "adder-subtractor-4bit",
      "sync-fifo",
      "traffic-light-fsm",
      "lfsr-8bit",
    ],
  },
  {
    id: "nvidia-crunch",
    title: "NVIDIA GPU & Interconnect 14-Day Sprint",
    duration: "14 Days",
    targetCompany: "NVIDIA ASIC / Architecture",
    badgeColor: "bg-[#76B900]/15 text-[#76B900] border-[#76B900]/40",
    description:
      "Focused on arbitration, high-speed FIFOs, bitwise encoders, and high-frequency datapath pipelines.",
    problemCount: 12,
    featuredSlugs: [
      "priority-encoder-8to3",
      "sync-fifo",
      "4-bit-alu",
      "edge-detector",
      "chip-adder-4bit",
    ],
  },
  {
    id: "apple-silicon-core",
    title: "Apple Silicon RTL Core Preparation",
    duration: "21 Days",
    targetCompany: "Apple SoC / Microarchitecture",
    badgeColor: "bg-text-primary/10 text-text-primary border-border",
    description:
      "Deep dive into ultra-low-power RTL, Gray code asynchronous pointers, and precision fixed-point arithmetic.",
    problemCount: 15,
    featuredSlugs: [
      "gray-code-converter",
      "leading-zero-counter",
      "binary-to-bcd",
      "sync-fifo",
      "traffic-light-fsm",
    ],
  },
];

export default function LearnPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LearnSection>("quest");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedRole, setSelectedRole] = useState(ROLE_QUESTS[0].role);

  useEffect(() => {
    async function init() {
      try {
        const probRes = await fetchProblems().catch(() => ({ problems: [], total: 0 }));
        setProblems(probRes.problems || []);
      } catch {
        // ignore
      }
    }
    init();
  }, []);

  const getProblem = (slug: string): Problem | undefined => {
    return problems.find((p) => p.slug === slug);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header & Overview */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 shadow-[0_0_12px_rgba(0,217,165,0.2)]">
              <GraduationCap className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-text-primary tracking-tight">
                HDLForge Academy
              </h1>
              <p className="text-xs text-text-muted">
                Role-Based Hardware Engineering Curriculum & Real Circuit Microarchitecture
              </p>
            </div>
          </div>
        </div>

        {/* LeetCode Style 4 Navigation Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-panel p-1.5">
          <button
            onClick={() => setActiveTab("quest")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "quest"
                ? "bg-accent text-[#070707] shadow-[0_0_12px_rgba(0,217,165,0.25)]"
                : "text-text-muted hover:text-text-primary hover:bg-surface"
            }`}
          >
            <Swords className="h-3.5 w-3.5" />
            <span>Quest</span>
          </button>

          <button
            onClick={() => setActiveTab("library")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "library"
                ? "bg-accent text-[#070707] shadow-[0_0_12px_rgba(0,217,165,0.25)]"
                : "text-text-muted hover:text-text-primary hover:bg-surface"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Library</span>
          </button>

          <button
            onClick={() => setActiveTab("explore")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "explore"
                ? "bg-accent text-[#070707] shadow-[0_0_12px_rgba(0,217,165,0.25)]"
                : "text-text-muted hover:text-text-primary hover:bg-surface"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Explore</span>
          </button>

          <button
            onClick={() => setActiveTab("study-plan")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "study-plan"
                ? "bg-accent text-[#070707] shadow-[0_0_12px_rgba(0,217,165,0.25)]"
                : "text-text-muted hover:text-text-primary hover:bg-surface"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Study Plan</span>
          </button>
        </div>
      </div>

      {/* 1. QUEST: Role-Based Hardware Tracks */}
      {activeTab === "quest" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Role Selection Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ROLE_QUESTS.map((q) => {
              const Icon = q.icon;
              const isSelected = selectedRole === q.role;
              return (
                <button
                  key={q.role}
                  onClick={() => setSelectedRole(q.role)}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-accent bg-accent/5 shadow-[0_0_20px_rgba(0,217,165,0.1)]"
                      : "border-border bg-panel hover:border-border/80 hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border ${q.badgeColor}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-xs font-bold text-accent">
                      +{q.totalXp} XP
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-text-primary">{q.role}</h3>
                  <p className="mt-1 text-xs text-text-muted line-clamp-2">
                    {q.tagline}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Role Quest Detail */}
          {(() => {
            const currentQuest =
              ROLE_QUESTS.find((q) => q.role === selectedRole) || ROLE_QUESTS[0];
            const QuestIcon = currentQuest.icon;

            return (
              <div className="rounded-2xl border border-border bg-panel p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border ${currentQuest.badgeColor}`}
                    >
                      <QuestIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-text-primary">
                        {currentQuest.role} Quest
                      </h2>
                      <p className="text-xs text-text-muted max-w-xl">
                        {currentQuest.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-surface px-3 py-1 text-xs font-mono font-bold text-accent border border-border">
                      {currentQuest.stages.length} Milestones
                    </span>
                  </div>
                </div>

                {/* Progressive Stages */}
                <div className="space-y-4">
                  {currentQuest.stages.map((stage) => (
                    <div
                      key={stage.stage}
                      className="rounded-xl border border-border/80 bg-surface/50 p-4 transition-colors hover:border-accent/30"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[#070707] font-mono text-xs font-black">
                            {stage.stage}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-text-primary">
                              {stage.title}
                            </h4>
                            <p className="text-xs text-text-muted font-mono mt-0.5">
                              {stage.concept}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Clickable Problem Cards in this Stage */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
                        {stage.problemSlugs.map((slug) => {
                          const p = getProblem(slug);
                          if (!p) return null;
                          return (
                            <Link
                              key={slug}
                              href={`/problems/${slug}`}
                              className="group flex items-center justify-between rounded-lg border border-border bg-panel p-2.5 transition-all hover:border-accent/40 hover:bg-surface"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="truncate text-xs font-bold text-text-primary group-hover:text-accent transition-colors">
                                  {p.title}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <DifficultyBadge difficulty={p.difficulty} size="sm" />
                                  <span className="text-[10px] text-text-dim">
                                    {p.category}
                                  </span>
                                </div>
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 text-text-dim group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 2. LIBRARY: Real Circuit & Hardware Engineering Concepts */}
      {activeTab === "library" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-text-primary">
                Hardware Engineering Knowledge Library
              </h2>
              <p className="text-xs text-text-muted">
                In-depth mathematical foundations, STA timing constraints, and physical microarchitecture
              </p>
            </div>
            <span className="text-xs font-mono text-text-dim">
              {HARDWARE_CONCEPTS.length} Deep Modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HARDWARE_CONCEPTS.map((concept) => (
              <div
                key={concept.id}
                className="rounded-2xl border border-border bg-panel p-5 space-y-3.5 transition-all hover:border-accent/40 hover:shadow-[0_0_20px_rgba(0,217,165,0.06)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-mono font-bold text-accent border border-border">
                      {concept.category}
                    </span>
                    <h3 className="text-base font-bold text-text-primary mt-1.5">
                      {concept.title}
                    </h3>
                  </div>
                  <DifficultyBadge difficulty={concept.difficulty} size="sm" />
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {concept.summary}
                </p>

                {concept.formula && (
                  <div className="rounded-xl border border-border bg-surface/80 p-3 font-mono text-[11px] text-accent leading-relaxed">
                    <pre className="overflow-x-auto whitespace-pre-wrap">
                      {concept.formula}
                    </pre>
                  </div>
                )}

                <div className="rounded-lg border border-border/60 bg-surface/40 p-2.5">
                  <p className="text-[11px] text-text-muted">
                    <strong className="text-text-primary">Interview Insight:</strong>{" "}
                    {concept.keyTakeaway}
                  </p>
                </div>

                {/* Matching Problems to solve */}
                <div className="pt-2 border-t border-border/50">
                  <span className="text-[10px] uppercase font-bold text-text-dim block mb-1.5">
                    Reinforce in HDLForge:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {concept.relatedProblemSlugs.map((slug) => {
                      const prob = getProblem(slug);
                      return (
                        <Link
                          key={slug}
                          href={`/problems/${slug}`}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-panel px-2 py-1 text-[11px] font-medium text-text-secondary hover:text-accent hover:border-accent transition-colors"
                        >
                          <Code2 className="h-2.5 w-2.5 text-accent" />
                          <span>{prob ? prob.title : slug}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. EXPLORE: Interactive Topic Modules */}
      {activeTab === "explore" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-black text-text-primary">Explore by Category</h2>
            <p className="text-xs text-text-muted">
              Interactive problem sets categorized by hardware design domain
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Combinational Logic",
                slugs: ["and-gate", "or-gate", "not-gate", "xor-gate", "2-to-1-mux", "priority-encoder-8to3"],
                desc: "Logic gates, multiplexers, and priority arbiters.",
                icon: Layers,
              },
              {
                title: "Arithmetic & Datapath",
                slugs: ["half-adder", "full-adder", "adder-subtractor-4bit", "4-bit-alu", "leading-zero-counter", "binary-to-bcd"],
                desc: "High-speed adders, 2's complement math, and BCD algorithms.",
                icon: Binary,
              },
              {
                title: "Sequential & Edge Logic",
                slugs: ["d-flip-flop", "4-bit-counter", "edge-detector", "lfsr-8bit"],
                desc: "Clocked registers, transition pulse detectors, and PRBS generators.",
                icon: Clock,
              },
              {
                title: "Finite State Machines",
                slugs: ["traffic-light-fsm"],
                desc: "Moore and Mealy controllers with glitch-free output guarantees.",
                icon: Cpu,
              },
              {
                title: "Memory & Queuing",
                slugs: ["sync-fifo", "gray-code-converter"],
                desc: "Circular FIFO queues, status watermarks, and Gray coding.",
                icon: Zap,
              },
              {
                title: "Modular Chip Parts",
                slugs: ["chip-adder-4bit", "chip-mux-4to1"],
                desc: "Hierarchical standard cell assembly and visual schematics.",
                icon: Sparkles,
              },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.title}
                  className="rounded-2xl border border-border bg-panel p-5 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-border text-accent">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-bold text-text-primary">
                        {cat.title}
                      </h3>
                    </div>
                    <p className="text-xs text-text-muted mb-4">{cat.desc}</p>

                    <div className="space-y-1.5">
                      {cat.slugs.map((slug) => {
                        const p = getProblem(slug);
                        if (!p) return null;
                        return (
                          <Link
                            key={slug}
                            href={`/problems/${slug}`}
                            className="flex items-center justify-between text-xs text-text-secondary hover:text-accent transition-colors py-1 border-b border-border/40 last:border-0"
                          >
                            <span className="truncate pr-2">{p.title}</span>
                            <DifficultyBadge difficulty={p.difficulty} size="sm" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  <Link
                    href={`/problems?category=${encodeURIComponent(cat.title)}`}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-accent/30 transition-all"
                  >
                    <span>View in Catalog</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. STUDY PLAN: Timed Interview Roadmaps */}
      {activeTab === "study-plan" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-black text-text-primary">Interview Study Plans</h2>
            <p className="text-xs text-text-muted">
              Structured time-budgeted plans curated for major silicon company interviews
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STUDY_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-border bg-panel p-5 space-y-4 flex flex-col justify-between transition-all hover:border-accent/40 hover:shadow-[0_0_24px_rgba(0,217,165,0.08)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold ${plan.badgeColor}`}
                    >
                      {plan.duration}
                    </span>
                    <span className="text-[10px] font-mono text-text-dim">
                      {plan.problemCount} Problems
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-text-primary">
                    {plan.title}
                  </h3>
                  <p className="mt-1 text-xs text-text-muted">{plan.description}</p>

                  <div className="mt-4 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-text-dim block">
                      Target Companies:
                    </span>
                    <span className="rounded bg-surface px-2 py-0.5 font-mono text-[11px] font-bold text-accent border border-border inline-block">
                      {plan.targetCompany}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 pt-3 border-t border-border/50">
                    <span className="text-[10px] uppercase font-bold text-text-dim block">
                      Core Problems:
                    </span>
                    {plan.featuredSlugs.map((slug) => {
                      const p = getProblem(slug);
                      return (
                        <Link
                          key={slug}
                          href={`/problems/${slug}`}
                          className="flex items-center justify-between text-xs text-text-secondary hover:text-accent transition-colors py-0.5"
                        >
                          <span className="truncate pr-2">{p ? p.title : slug}</span>
                          <ChevronRight className="h-3 w-3 text-text-dim" />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <Link
                  href={`/problems`}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-accent py-2 text-xs font-bold text-[#070707] transition-all hover:bg-accent-hover shadow-[0_0_12px_rgba(0,217,165,0.2)]"
                >
                  <span>Start Plan</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

