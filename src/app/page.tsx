"use client";

<<<<<<< HEAD
import { useState } from "react";
import Link from "next/link";
import {
  Cpu,
  CheckCircle2,
  Activity,
  Sparkles,
  ArrowRight,
  Terminal,
  Zap,
  Layers,
  ShieldCheck,
  Play,
  Flame,
  Code2,
  Lock,
  Trophy,
  Building2,
  Boxes,
  Clock,
  Users,
  Calendar,
  ChevronRight,
  Award,
} from "lucide-react";

interface CodeSnippetDemo {
  id: string;
  name: string;
  lang: string;
  company: string;
  code: string;
  latency: string;
  signals: { name: string; trace: string; color: string }[];
}

const SNIPPET_DEMOS: CodeSnippetDemo[] = [
  {
    id: "adder",
    name: "chip_adder4.sv",
    lang: "SYSTEMVERILOG",
    company: "Intel / AMD Interview",
    latency: "4 Gate Delays",
    code: `module chip_adder4 (
  input  wire [3:0] a,
  input  wire [3:0] b,
  input  wire       cin,
  output wire [3:0] sum,
  output wire       cout
);
  wire c1, c2, c3;

  // Hierarchical Standard-Cell Instantiation
  full_adder fa0 (.a(a[0]), .b(b[0]), .cin(cin), .sum(sum[0]), .cout(c1));
  full_adder fa1 (.a(a[1]), .b(b[1]), .cin(c1),  .sum(sum[1]), .cout(c2));
  full_adder fa2 (.a(a[2]), .b(b[2]), .cin(c2),  .sum(sum[2]), .cout(c3));
  full_adder fa3 (.a(a[3]), .b(b[3]), .cin(c3),  .sum(sum[3]), .cout(cout));

endmodule`,
    signals: [
      { name: "clk", trace: "_/\\_/\\_/\\_/\\_/\\_/\\_/\\", color: "text-accent" },
      { name: "a[3:0]", trace: "==< 0x7 >===< 0x2 >==", color: "text-info" },
      { name: "b[3:0]", trace: "==< 0x9 >===< 0x3 >==", color: "text-info" },
      { name: "sum[3:0]", trace: "==< 0x0 >===< 0x5 >==", color: "text-accent" },
      { name: "cout", trace: "____/~~~~~~~\\_______", color: "text-warning" },
    ],
  },
  {
    id: "fifo",
    name: "sync_fifo.sv",
    lang: "SYSTEMVERILOG",
    company: "NVIDIA / Apple Interview",
    latency: "1 Cycle Read/Write",
    code: `module sync_fifo #(parameter DEPTH=8, WIDTH=8) (
  input  wire             clk, rst,
  input  wire             wr_en, rd_en,
  input  wire [WIDTH-1:0] din,
  output reg  [WIDTH-1:0] dout,
  output wire             full, empty
);
  reg [WIDTH-1:0] mem [0:DEPTH-1];
  reg [$clog2(DEPTH)-1:0] wr_ptr, rd_ptr;
  reg [$clog2(DEPTH):0]   count;

  assign empty = (count == 0);
  assign full  = (count == DEPTH);

  always @(posedge clk) begin
    if (rst) begin
      wr_ptr <= 0; rd_ptr <= 0; count <= 0; dout <= 0;
    end else begin
      if (wr_en && !full)  begin mem[wr_ptr] <= din; wr_ptr <= wr_ptr + 1; end
      if (rd_en && !empty) begin dout <= mem[rd_ptr]; rd_ptr <= rd_ptr + 1; end
      count <= count + (wr_en && !full) - (rd_en && !empty);
    end
  end
endmodule`,
    signals: [
      { name: "clk", trace: "_/\\_/\\_/\\_/\\_/\\_/\\_/\\", color: "text-accent" },
      { name: "wr_en", trace: "____/~~~\\___________", color: "text-info" },
      { name: "din[7:0]", trace: "====< 0xAA >=========", color: "text-info" },
      { name: "rd_en", trace: "__________/~~~\\_____", color: "text-warning" },
      { name: "dout[7:0]", trace: "==========< 0xAA >===", color: "text-accent" },
      { name: "empty", trace: "~~~~\\___________/~~~", color: "text-text-muted" },
    ],
  },
  {
    id: "and",
    name: "and_gate.sv",
    lang: "VERILOG",
    company: "Texas Instruments / Qualcomm",
    latency: "Combinational (0 cycles)",
    code: `module and_gate (
  input  wire a,
  input  wire b,
  output wire y
);
  // Continuous assignment for digital logic AND
  assign y = a & b;

endmodule`,
    signals: [
      { name: "a", trace: "____/~~~~~~~~~~~\\___", color: "text-info" },
      { name: "b", trace: "________/~~~~~~~~~~~", color: "text-info" },
      { name: "y", trace: "________/~~~~~~~\\___", color: "text-accent" },
    ],
  },
];
=======
import { useEffect, useState } from "react";
import Link from "next/link";
import CircuitBoard from "@/components/CircuitBoard";
import TypingCodeHero from "@/components/TypingCodeHero";
import {
  Activity,
  ArrowRight,
  Terminal,
  Flame,
  Code2,
  Trophy,
  Building2,
  Boxes,
} from "lucide-react";
>>>>>>> friend/Bvs_SubBranch

const capabilities = [
  {
    title: "Company Interview Questions",
    description:
      "Practice real hardware interview questions asked at NVIDIA, Apple, Intel, Qualcomm, AMD, and ARM. Master CDC, circular FIFOs, and FSM sequence detectors.",
    icon: Building2,
    badge: "Interview Prep",
  },
  {
    title: "Modular Chip Design & Parts",
    description:
      "Construct digital ICs by instantiating standard-cell parts. Interactive silicon architecture visualizer with pin maps and instant copy templates.",
    icon: Boxes,
    badge: "EDA Visualizer",
  },
  {
    title: "Daily Hardware Challenge",
    description:
      "Build consistent HDL mastery with a new curated problem every morning. Keep your streak alive and earn bonus XP on your path to senior VLSI engineer.",
    icon: Flame,
    badge: "Daily Streak",
  },
  {
    title: "Live Timed Contests",
    description:
      "Compete in 90-minute Weekly Hardware Sprints and Biweekly Silicon Cups. Ranked by testbench simulation pass rate, clock latency, and gate efficiency.",
    icon: Trophy,
    badge: "Global Rating",
  },
  {
    title: "Sandboxed RTL Execution",
    description:
      "Submit Verilog & SystemVerilog designs and execute them inside isolated, low-latency Docker sandboxes powered by Icarus Verilog and Verilator.",
    icon: Terminal,
    badge: "Zero Setup",
  },
  {
    title: "VCD Waveform Debugging",
    description:
      "Interactive digital timing diagrams rendered in your browser. Inspect transitions, clock edges, and signal busses cycle-by-cycle.",
    icon: Activity,
    badge: "Interactive",
  },
];

const topics = [
  "Combinational Gates",
  "Adders & ALUs",
  "Plexers & Decoders",
  "Sequential Latches & Flip-Flops",
  "Finite State Machines (FSM)",
  "Counters & Shift Registers",
  "Synchronous FIFOs",
  "AXI4-Lite & APB Protocols",
<<<<<<< HEAD
];

export default function HomePage() {
  const [activeSnippetIndex, setActiveSnippetIndex] = useState(0);
  const activeSnippet = SNIPPET_DEMOS[activeSnippetIndex];

  return (
    <div className="relative min-h-screen bg-background overflow-hidden text-text-primary">
      {/* Sleek Ambient Lighting & Engineering Matrix Grid (No background image, pure clean modern UI) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        {/* Soft Radial Ambient Aura */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[550px] w-[950px] rounded-full bg-gradient-to-b from-teal-500/8 via-accent/4 to-transparent blur-[120px] dark:from-accent/15 dark:via-cyan-500/10 dark:to-transparent" />
        <div className="absolute top-[650px] right-1/4 h-[300px] w-[450px] rounded-full bg-teal-500/5 dark:bg-accent/5 blur-[100px]" />

        {/* Modern Dot Matrix Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.45] dark:opacity-[0.25]"
          style={{
            backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 18%, black 40%, transparent 90%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 18%, black 40%, transparent 90%)",
          }}
        />
      </div>

=======
];

const COMPANY_LOGOS = [
  { name: "NVIDIA", color: "hover:text-[#76B900] hover:border-[#76B900]/40" },
  { name: "Apple Silicon", color: "hover:text-zinc-100 hover:border-zinc-400/40" },
  { name: "Intel", color: "hover:text-[#00A3FF] hover:border-[#0071C5]/40" },
  { name: "Qualcomm", color: "hover:text-[#6080FF] hover:border-[#3253DC]/40" },
  { name: "AMD", color: "hover:text-[#FF4A50] hover:border-[#ED1C24]/40" },
  { name: "Google Silicon", color: "hover:text-[#4285F4] hover:border-[#4285F4]/40" },
  { name: "ARM", color: "hover:text-[#00C2FF] hover:border-[#0091BD]/40" },
  { name: "Texas Instruments", color: "hover:text-[#CC0000] hover:border-[#CC0000]/40" },
  { name: "Broadcom", color: "hover:text-[#CC0000] hover:border-[#CC0000]/40" },
];

const METRICS = [
  { value: "100%", color: "text-accent", label: "Browser-Based Simulation" },
  { value: "Icarus & Verilator", color: "text-text-primary", label: "Industry Standard Engines" },
  { value: "VCD & GTKWave", color: "text-info", label: "True Signal Timing Analysis" },
  { value: "Zero Setup", color: "text-text-primary", label: "No Expensive EDA Licenses" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Code2,
    title: "Write RTL",
    desc: "Type Verilog or SystemVerilog your way. No line-by-line, letter-perfect matching pressure — your structure and style are up to you.",
    href: "/problems",
  },
  {
    step: "02",
    icon: Terminal,
    title: "Compile & Verify",
    desc: "Instant Docker sandbox runs iverilog & Verilator against hidden testbenches. Passing means correct behavior, never identical text.",
    href: "/problems/chip-adder-4bit",
  },
  {
    step: "03",
    icon: Activity,
    title: "Inspect Waveforms",
    desc: "VCD timing diagrams render right in the browser. Walk clock edges, busses, and signal transitions cycle-by-cycle.",
    href: "/problems/chip-adder-4bit",
  },
];

export default function HomePage() {
  const [nextContest, setNextContest] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    function tick() {
      const now = new Date();
      const target = new Date(now);
      const daysUntilSunday = (7 - target.getUTCDay()) % 7;
      target.setUTCDate(target.getUTCDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
      target.setUTCHours(18, 0, 0, 0);
      const diff = Math.max(0, target.getTime() - now.getTime());
      setNextContest({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden text-text-primary">
      {/* Animated Circuit Board Background Overlay */}
      <CircuitBoard />

      {/* Ambient Neon Glow Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[550px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-accent/15 via-info/10 to-transparent blur-[140px]" />
        <div className="absolute top-[800px] left-1/4 h-[400px] w-[600px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#00D9A5 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

>>>>>>> friend/Bvs_SubBranch
      {/* Hero Section */}
      <section className="relative px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          {/* Eyebrow Pill */}
<<<<<<< HEAD
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-teal-600/30 dark:border-accent/40 bg-teal-50 dark:bg-accent/10 px-4 py-1.5 text-xs font-bold text-teal-800 dark:text-accent shadow-xs backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-teal-600 dark:bg-accent animate-pulse" />
            <span className="tracking-wide uppercase text-[11px] font-mono">Platform for Hardware, ECE &amp; EEE Engineers</span>
          </div>

          <h1 className="mb-6 text-4xl font-black tracking-tight sm:text-6xl md:text-7xl text-slate-900 dark:text-white leading-[1.1]">
            Master Hardware.
            <br />
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 dark:from-accent dark:via-emerald-400 dark:to-cyan-300 bg-clip-text text-transparent">
              Learn  Simulate  Debug
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base sm:text-lg text-slate-700 dark:text-zinc-300 leading-relaxed font-normal">
=======
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent shadow-[0_0_15px_rgba(0,217,165,0.15)]">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span>The LeetCode for Hardware, ECE &amp; EEE Engineers</span>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            Master Hardware Design.
            <br />
            <span className="gradient-accent-text">One RTL Problem at a Time.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base text-text-secondary sm:text-lg leading-relaxed">
>>>>>>> friend/Bvs_SubBranch
            Practice Verilog &amp; SystemVerilog with instant sandboxed simulation, automated corner-case verification, browser-based waveform timing diagrams, and company interview tracks.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/problems"
<<<<<<< HEAD
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-8 text-sm font-bold text-accent-fg transition-all hover:bg-accent-hover shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95"
=======
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-8 text-sm font-bold text-[#070707] transition-all hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(0,217,165,0.35)] transform hover:-translate-y-0.5 active:scale-95"
>>>>>>> friend/Bvs_SubBranch
            >
              Start Practicing Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contests"
<<<<<<< HEAD
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-panel px-6 text-sm font-semibold text-text-primary transition-all hover:border-accent/40 hover:bg-surface shadow-xs"
=======
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-panel/80 backdrop-blur-md px-6 text-sm font-semibold text-text-secondary transition-all hover:border-accent/40 hover:bg-surface hover:text-text-primary"
>>>>>>> friend/Bvs_SubBranch
            >
              <Trophy className="h-4 w-4 text-warning" />
              Join Weekly Contest
            </Link>
          </div>

<<<<<<< HEAD
          {/* Target Hardware Companies Row (LeetCode Style) */}
          <div className="mt-12 flex flex-col items-center justify-center gap-3">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-medium">
              Preparing engineers for technical hardware interviews at
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl">
              {[
                { name: "NVIDIA", color: "hover:text-[#76B900] hover:border-[#76B900]/40" },
                { name: "Apple Silicon", color: "hover:text-slate-900 dark:hover:text-zinc-100 hover:border-zinc-400/40" },
                { name: "Intel", color: "hover:text-[#0071C5] dark:hover:text-[#00A3FF] hover:border-[#0071C5]/40" },
                { name: "Qualcomm", color: "hover:text-[#3253DC] dark:hover:text-[#6080FF] hover:border-[#3253DC]/40" },
                { name: "AMD", color: "hover:text-[#ED1C24] dark:hover:text-[#FF4A50] hover:border-[#ED1C24]/40" },
                { name: "Google Silicon", color: "hover:text-[#4285F4] hover:border-[#4285F4]/40" },
                { name: "ARM", color: "hover:text-[#0091BD] dark:hover:text-[#00C2FF] hover:border-[#0091BD]/40" },
                { name: "Texas Instruments", color: "hover:text-[#CC0000] hover:border-[#CC0000]/40" },
                { name: "Broadcom", color: "hover:text-[#CC0000] hover:border-[#CC0000]/40" },
                { name: "MediaTek", color: "hover:text-[#F37021] hover:border-[#F37021]/40" },
              ].map((comp) => (
                <span
                  key={comp.name}
                  className={`rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-all ${comp.color} hover:bg-surface shadow-2xs`}
                >
                  {comp.name}
                </span>
              ))}
            </div>
          </div>

          {/* Interactive Code / Hardware IDE Preview Card with Dynamic Demo Tabs */}
          <div className="mt-14 mx-auto max-w-4xl rounded-2xl border border-border bg-panel shadow-2xl overflow-hidden backdrop-blur-xl text-left">
            {/* Window Topbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/80 bg-surface/80 px-4 py-2 gap-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-error/70" />
                <span className="h-3 w-3 rounded-full bg-warning/70" />
                <span className="h-3 w-3 rounded-full bg-success/70" />

                {/* Switchable Problem Tabs */}
                <div className="ml-3 flex items-center gap-1">
                  {SNIPPET_DEMOS.map((snippet, idx) => (
                    <button
                      key={snippet.id}
                      onClick={() => setActiveSnippetIndex(idx)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                        activeSnippetIndex === idx
                          ? "bg-panel text-accent font-bold shadow-sm border border-accent/30"
                          : "text-text-muted hover:text-text-secondary hover:bg-surface/50"
                      }`}
                    >
                      {snippet.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded bg-accent/15 px-2 py-0.5 font-mono text-[10px] font-bold text-accent border border-accent/20">
                  {activeSnippet.company}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-success">
                  <CheckCircle2 className="h-3 w-3" />
                  Docker Sandbox OK
                </span>
              </div>
            </div>

            {/* Code Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left Code Editor View */}
              <div className="lg:col-span-8 p-5 bg-panel dark:bg-[#0B0F14] border-b lg:border-b-0 lg:border-r border-border/80 overflow-x-auto font-mono text-xs text-text-primary">
                <pre className="leading-relaxed font-mono selection:bg-accent/30">
                  {activeSnippet.code}
                </pre>
              </div>

              {/* Right Simulation Waveform & Metrics View */}
              <div className="lg:col-span-4 p-5 bg-surface/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim">
                      Live Simulation Output
                    </span>
                    <span className="rounded bg-success/15 px-2 py-0.5 text-[10px] font-mono font-bold text-success">
                      ALL PASS
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-xs font-mono">
                    <div className="flex justify-between text-text-muted">
                      <span>Latency Target:</span>
                      <span className="text-accent font-semibold">{activeSnippet.latency}</span>
                    </div>
                    <div className="flex justify-between text-text-muted">
                      <span>Engine:</span>
                      <span className="text-text-secondary">Icarus 11.0 (Docker)</span>
                    </div>
                  </div>

                  {/* Micro waveform timing graph */}
                  <div className="rounded-xl border border-border bg-surface/60 dark:bg-[#07090D] p-3">
                    <span className="text-[9px] text-text-dim uppercase tracking-wider block mb-2 font-mono">
                      Signal Waveform (VCD)
                    </span>
                    <div className="space-y-1.5 font-mono text-[10px]">
                      {activeSnippet.signals.map((sig) => (
                        <div key={sig.name} className="flex items-center justify-between">
                          <span className="text-text-dim w-16 truncate">{sig.name}:</span>
                          <span className={`tracking-widest ${sig.color}`}>{sig.trace}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex justify-end">
                  <Link
                    href={`/problems/${activeSnippet.id === "adder" ? "chip-adder-4bit" : activeSnippet.id === "fifo" ? "sync-fifo" : "and-gate"}`}
                    className="flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                  >
                    <span>Open in Workbench</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Hardware & Semiconductor Visual Showcase (ECE & EEE Disciplines) */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-600/30 dark:border-accent/30 bg-teal-50/80 dark:bg-accent/10 px-3.5 py-1 text-xs font-semibold text-teal-800 dark:text-accent shadow-2xs">
            <Cpu className="h-3.5 w-3.5 text-teal-600 dark:text-accent" />
            <span className="font-mono text-[11px] uppercase tracking-wide">Silicon to System • ECE &amp; EEE Curriculum</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Bridging Academic Theory with Silicon Reality
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            From microscopic standard-cell lithography to FPGA hardware emulation benches, HDLForge trains electronics, electrical, and computer engineering students for the modern semiconductor stack.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: VLSI & Silicon ASIC Design */}
          <div className="group rounded-2xl border border-border bg-panel overflow-hidden transition-all duration-300 hover:border-accent/50 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(0,229,163,0.12)] flex flex-col justify-between">
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-surface">
                <img
                  src="/images/hardware/silicon-chip.jpg"
                  alt="Microscopic Silicon Chip Die"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
                <span className="absolute top-3 left-3 rounded-md bg-panel/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono font-bold text-teal-700 dark:text-accent border border-border shadow-xs">
                  ECE • VLSI &amp; ASIC
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-accent transition-colors">
                  Silicon Die &amp; Gate Arrays
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Design synthesis-ready RTL. Master Boolean gates, adders, decoders, and static timing constraints evaluated at nanometer scale.
                </p>
              </div>
            </div>
            <div className="p-4 pt-0">
              <Link
                href="/problems?category=Combinational+Logic"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-accent hover:underline"
              >
                <span>Combinational Logic (10)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: FPGA Hardware Emulation */}
          <div className="group rounded-2xl border border-border bg-panel overflow-hidden transition-all duration-300 hover:border-info/50 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.12)] flex flex-col justify-between">
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-surface">
                <img
                  src="/images/hardware/fpga-board.jpg"
                  alt="FPGA Hardware Development Kit"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
                <span className="absolute top-3 left-3 rounded-md bg-panel/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono font-bold text-blue-700 dark:text-info border border-border shadow-xs">
                  Hardware Emulation
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-info transition-colors">
                  FPGA Prototyping Systems
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Implement sequential registers, LFSR pseudo-random streams, and synchronous circular FIFOs with FPGA BRAM and DSP blocks.
                </p>
              </div>
            </div>
            <div className="p-4 pt-0">
              <Link
                href="/problems?category=Sequential+Logic"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-info hover:underline"
              >
                <span>Sequential Logic (10)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Semiconductor Cleanroom Fab */}
          <div className="group rounded-2xl border border-border bg-panel overflow-hidden transition-all duration-300 hover:border-warning/50 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(234,179,8,0.12)] flex flex-col justify-between">
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-surface">
                <img
                  src="/images/hardware/wafer-fab.jpg"
                  alt="Semiconductor Wafer Lithography"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
                <span className="absolute top-3 left-3 rounded-md bg-panel/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono font-bold text-amber-700 dark:text-warning border border-border shadow-xs">
                  Semiconductor Foundry
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-warning transition-colors">
                  Wafer Fab &amp; Memory Layout
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Model SRAM cells, ROM arrays, and CAM memory structures fabricated across multi-project wafers at TSMC, Intel, and GlobalFoundries.
                </p>
              </div>
            </div>
            <div className="p-4 pt-0">
              <Link
                href="/problems?category=Chip+Design"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-warning hover:underline"
              >
                <span>Chip Design &amp; Memory (10)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Waveform Verification & Oscilloscopes */}
          <div className="group rounded-2xl border border-border bg-panel overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(168,85,247,0.12)] flex flex-col justify-between">
            <div>
              <div className="relative h-44 w-full overflow-hidden bg-surface">
                <img
                  src="/images/hardware/oscilloscope.jpg"
                  alt="Tektronix Digital Oscilloscope & Logic Analyzer"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
                <span className="absolute top-3 left-3 rounded-md bg-panel/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono font-bold text-purple-700 dark:text-purple-400 border border-border shadow-xs">
                  EEE &amp; Test Engineering
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Bus Protocols &amp; FSMs
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Debug timing violations, cycle-by-cycle clock jitter, and UART/SPI finite state controllers with real-time browser VCD waveforms.
                </p>
              </div>
            </div>
            <div className="p-4 pt-0">
              <Link
                href="/problems?category=Finite+State+Machines"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline"
              >
                <span>Finite State Machines (10)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
=======
          {/* Animated Terminal / Code Demo (Typing → Compile → Waveform) */}
          <div className="mx-auto mt-12 w-full max-w-4xl">
            <TypingCodeHero />
          </div>

          {/* How it works — behavior-based, not copy-paste */}
          <div className="mx-auto mt-14 max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="text-xl font-bold sm:text-2xl text-text-primary">
                Learn by Building Chips, Not Copy-Pasting Code
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-xs text-text-muted">
                Solutions are graded on simulated behavior — names, spacing, and structure are completely your call.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step) => {
                const Icon = step.icon;
                return (
                  <Link
                    key={step.step}
                    href={step.href}
                    className="group rounded-2xl border border-border bg-panel p-6 text-left transition-all hover:border-accent/40 hover:shadow-[0_0_24px_rgba(0,217,165,0.08)]"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all group-hover:bg-accent/20 group-hover:shadow-[0_0_12px_rgba(0,217,165,0.2)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-text-dim">{step.step}</span>
                    </div>
                    <h3 className="mb-2 text-sm font-semibold text-text-primary transition-colors group-hover:text-accent">
                      {step.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-text-muted">{step.desc}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Target Hardware Companies Row (Rotating Marquee) */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4">
            <span className="text-[11px] font-mono uppercase tracking-widest text-text-dim">
              Preparing students for technical hardware interviews at
            </span>
            <div
              className="relative w-screen overflow-hidden"
              style={{
                marginLeft: "calc(50% - 50vw)",
                maskImage:
                  "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
              }}
            >
              <div className="flex w-max items-center gap-4 animate-[stats-marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
                {[...COMPANY_LOGOS, ...COMPANY_LOGOS].map((comp, idx) => (
                  <span
                    key={`${comp.name}-${idx}`}
                    className={`shrink-0 rounded-xl border border-border/80 bg-surface/60 px-4 py-2 text-sm font-semibold text-text-secondary transition-all cursor-default ${comp.color} hover:bg-surface`}
                  >
                    {comp.name}
                  </span>
                ))}
              </div>
>>>>>>> friend/Bvs_SubBranch
            </div>
          </div>
        </div>
      </section>

      {/* Daily Challenge & Weekly Contests Twin Cards */}
      <section className="px-4 py-8 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Daily Challenge Spotlight Card */}
<<<<<<< HEAD
          <div className="relative overflow-hidden rounded-2xl border border-border bg-panel p-6 shadow-sm group hover:border-accent hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-1.5 rounded-md bg-amber-50 dark:bg-warning/15 px-2.5 py-1 text-xs font-mono font-bold text-amber-800 dark:text-warning border border-amber-300 dark:border-warning/30">
                <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-warning" />
                Problem of the Day
              </span>
              <span className="text-xs font-mono text-teal-700 dark:text-accent font-bold">+50 Bonus XP</span>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-1 group-hover:text-accent transition-colors">
              4-Bit Ripple Carry Adder Chip
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mb-4 leading-relaxed">
              Compose a 4-bit addition processor chip using standard cell full adder parts. Tested for corner cases and carry propagation.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-zinc-400 font-medium">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Easy</span>
=======
          <div className="relative overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-panel to-surface p-6 shadow-xl group hover:border-accent transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-1.5 rounded-md bg-warning/15 px-2.5 py-1 text-xs font-mono font-bold text-warning border border-warning/30">
                <Flame className="h-3.5 w-3.5" />
                Problem of the Day
              </span>
              <span className="text-xs font-mono text-accent font-semibold">+50 Bonus XP</span>
            </div>

            <h3 className="text-base font-bold text-text-primary mb-1 group-hover:text-accent transition-colors">
              4-Bit Ripple Carry Adder Chip
            </h3>
            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Compose a 4-bit addition processor chip using standard cell full adder parts. Tested for corner cases and carry propagation.
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div className="flex items-center gap-2 text-[11px] font-mono text-text-dim">
                <span>Easy</span>
>>>>>>> friend/Bvs_SubBranch
                <span>•</span>
                <span>Intel, AMD</span>
              </div>
              <Link
                href="/problems/chip-adder-4bit"
<<<<<<< HEAD
                className="flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-accent group-hover:translate-x-1 transition-all"
=======
                className="flex items-center gap-1 text-xs font-bold text-accent group-hover:translate-x-1 transition-all"
>>>>>>> friend/Bvs_SubBranch
              >
                <span>Solve Today</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Weekly Contest Spotlight Card */}
<<<<<<< HEAD
          <div className="relative overflow-hidden rounded-2xl border border-border bg-panel p-6 shadow-sm group hover:border-info hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-info/15 px-2.5 py-1 text-xs font-mono font-bold text-blue-800 dark:text-info border border-blue-300 dark:border-info/30">
                <Trophy className="h-3.5 w-3.5 text-blue-600 dark:text-info" />
                Weekly Hardware Sprint #42
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 font-medium">90 Minutes</span>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-1 group-hover:text-info transition-colors">
              Live Digital VLSI Competition
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mb-4 leading-relaxed">
              Sponsored by NVIDIA Microarchitecture Team. 4 timed RTL questions ranging from multiplexer trees to pipelined ALUs.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 font-medium">
                Starts Sunday 2:00 PM • Free
              </span>
              <Link
                href="/contests"
                className="flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-info group-hover:translate-x-1 transition-all"
=======
          <div className="relative overflow-hidden rounded-2xl border border-info/40 bg-gradient-to-br from-panel to-surface p-6 shadow-xl group hover:border-info transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-1.5 rounded-md bg-info/15 px-2.5 py-1 text-xs font-mono font-bold text-info border border-info/30">
                <Trophy className="h-3.5 w-3.5" />
                Weekly Hardware Sprint #42
              </span>
              <span className="text-xs font-mono text-text-dim">90 Minutes</span>
            </div>

            <h3 className="text-base font-bold text-text-primary mb-1 group-hover:text-info transition-colors">
              Live Digital VLSI Competition
            </h3>
            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Sponsored by NVIDIA Microarchitecture Team. 4 timed RTL questions ranging from multiplexer trees to pipelined ALUs.
            </p>

            <div className="mb-4 flex items-center gap-2 rounded-lg border border-info/20 bg-info/5 px-3 py-2">
              <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider text-info">
                {nextContest ? "Starts in" : "Live now"}
              </span>
              <span className="ml-auto font-mono text-xs font-bold tabular-nums text-text-primary">
                {nextContest
                  ? `${nextContest.d}d ${nextContest.h}h ${nextContest.m}m ${nextContest.s}s`
                  : "competing…"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-[11px] font-mono text-text-dim">
                Sunday 2:00 PM • Free
              </span>
              <Link
                href="/contests"
                className="flex items-center gap-1 text-xs font-bold text-info group-hover:translate-x-1 transition-all"
>>>>>>> friend/Bvs_SubBranch
              >
                <span>View Contest Arena</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* Metrics Banner */}
      <section className="border-y border-border bg-panel px-4 py-8 shadow-2xs">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-accent">50+</div>
            <div className="mt-1 text-xs font-medium text-slate-600 dark:text-zinc-400">Curated RTL Problems</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">100%</div>
            <div className="mt-1 text-xs font-medium text-slate-600 dark:text-zinc-400">In-Browser Simulation</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-accent">VCD &amp; Digital</div>
            <div className="mt-1 text-xs font-medium text-slate-600 dark:text-zinc-400">True Signal Timing Analysis</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Zero Setup</div>
            <div className="mt-1 text-xs font-medium text-slate-600 dark:text-zinc-400">No Expensive EDA Licenses</div>
=======
      {/* Metrics Banner (Rotating Marquee) */}
      <section className="relative overflow-hidden border-y border-border bg-panel/60 py-9 backdrop-blur-md">
        <div
          className="w-full overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
        >
          <div className="flex w-max items-center gap-16 animate-[stats-marquee_35s_linear_infinite] hover:[animation-play-state:paused]">
            {[...METRICS, ...METRICS].map((metric, idx) => (
              <div
                key={`${metric.label}-${idx}`}
                className="flex shrink-0 flex-col items-center text-center"
              >
                <div className={`text-2xl font-black whitespace-nowrap sm:text-4xl ${metric.color}`}>
                  {metric.value}
                </div>
                <div className="mt-1 text-xs text-text-muted whitespace-nowrap">
                  {metric.label}
                </div>
              </div>
            ))}
>>>>>>> friend/Bvs_SubBranch
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
<<<<<<< HEAD
            <h2 className="mb-3 text-2xl font-black sm:text-3xl text-slate-900 dark:text-white">
              Built for Modern ECE &amp; EEE Engineers
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
=======
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl text-text-primary">
              Built for Modern ECE &amp; EEE Engineers
            </h2>
            <p className="text-xs text-text-muted max-w-md mx-auto">
>>>>>>> friend/Bvs_SubBranch
              Everything required to ace semiconductor company technical interviews and master hardware microarchitecture.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
<<<<<<< HEAD
                  className="rounded-2xl border border-border bg-panel p-6 transition-all hover:border-accent/40 hover:shadow-md dark:hover:shadow-[0_0_24px_rgba(0,229,163,0.08)] group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-accent/10 text-teal-700 dark:text-accent group-hover:bg-teal-100 dark:group-hover:bg-accent/20 transition-all">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-zinc-400 border border-border">
                      {cap.badge}
                    </span>
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-accent transition-colors">
                    {cap.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
=======
                  className="rounded-2xl border border-border bg-panel p-6 transition-all hover:border-accent/40 hover:shadow-[0_0_24px_rgba(0,217,165,0.08)] group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent/20 group-hover:shadow-[0_0_12px_rgba(0,217,165,0.2)] transition-all">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-semibold text-text-dim border border-border">
                      {cap.badge}
                    </span>
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {cap.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-text-muted">
>>>>>>> friend/Bvs_SubBranch
                    {cap.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Topics Curriculum Pill Matrix */}
<<<<<<< HEAD
      <section className="border-t border-border bg-panel/60 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-3 text-xl font-bold sm:text-2xl text-slate-900 dark:text-white">
            Comprehensive Digital Logic Curriculum
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto mb-8">
=======
      <section className="border-t border-border bg-panel/40 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-3 text-xl font-bold sm:text-2xl text-text-primary">
            Comprehensive Digital Logic Curriculum
          </h2>
          <p className="text-xs text-text-muted max-w-md mx-auto mb-8">
>>>>>>> friend/Bvs_SubBranch
            From basic Boolean gates to complex pipelined processors and industry-standard bus protocols.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {topics.map((t) => (
              <span
                key={t}
<<<<<<< HEAD
                className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:border-accent/40 hover:text-teal-700 dark:hover:text-accent transition-all cursor-default shadow-2xs"
=======
                className="rounded-xl border border-border bg-surface/80 px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-accent/40 hover:text-accent transition-all cursor-default"
>>>>>>> friend/Bvs_SubBranch
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
<<<<<<< HEAD
        <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-gradient-to-br from-panel via-surface to-teal-500/5 dark:to-accent/5 p-10 text-center shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 h-64 w-64 bg-teal-500/10 dark:bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">
            Ready to Ace Your Next Hardware Interview?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-md mx-auto mb-8 leading-relaxed font-normal">
=======
        <div className="mx-auto max-w-4xl rounded-3xl border border-accent/30 bg-gradient-to-br from-panel via-surface to-[#0A1813] p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 h-64 w-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary mb-4">
            Ready to Ace Your Next Hardware Interview?
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto mb-8 leading-relaxed">
>>>>>>> friend/Bvs_SubBranch
            Join thousands of electronics, electrical, and computer engineering students practicing RTL coding daily.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/problems"
<<<<<<< HEAD
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-8 text-sm font-bold text-accent-fg transition-all hover:bg-accent-hover shadow-md hover:shadow-lg active:scale-95"
=======
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-8 text-sm font-bold text-[#070707] transition-all hover:bg-accent-hover hover:shadow-[0_0_24px_rgba(0,217,165,0.4)] active:scale-95"
>>>>>>> friend/Bvs_SubBranch
            >
              Start Practicing Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}