"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { fetchContestById } from "@/lib/api";
import { Contest, ContestLeaderboardEntry } from "@/lib/types";
import DifficultyBadge from "@/components/DifficultyBadge";
import {
  Trophy,
  Clock,
  ArrowLeft,
  ArrowRight,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  Zap,
  Flame,
  Shield,
  Code2,
  Check,
} from "lucide-react";

const MOCK_CONTEST_LEADERBOARD: ContestLeaderboardEntry[] = [
  { rank: 1, username: "silicon_ninja", displayName: "Alex Rivera", score: 2100, finishTimeSeconds: 3120, problemsSolved: 4, penaltyMinutes: 0 },
  { rank: 2, username: "verilog_master", displayName: "Priya Sharma", score: 2100, finishTimeSeconds: 3840, problemsSolved: 4, penaltyMinutes: 5 },
  { rank: 3, username: "asic_guru", displayName: "David Chen", score: 2100, finishTimeSeconds: 4210, problemsSolved: 4, penaltyMinutes: 10 },
  { rank: 4, username: "fpga_wizard", displayName: "Elena Rostova", score: 1300, finishTimeSeconds: 2450, problemsSolved: 3, penaltyMinutes: 0 },
  { rank: 5, username: "rtl_architect", displayName: "Kavya Patel", score: 1300, finishTimeSeconds: 2980, problemsSolved: 3, penaltyMinutes: 5 },
  { rank: 6, username: "chip_crafter", displayName: "Marcus Vance", score: 700, finishTimeSeconds: 1540, problemsSolved: 2, penaltyMinutes: 0 },
  { rank: 7, username: "logic_smith", displayName: "Sarah Jenkins", score: 300, finishTimeSeconds: 620, problemsSolved: 1, penaltyMinutes: 0 },
];

export default function ContestArenaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const contestId = resolvedParams.id;

  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90 * 60);
  const [activeTab, setActiveTab] = useState<"problems" | "leaderboard" | "rules">("problems");
  const [solvedSlugs, setSolvedSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadContest() {
      setLoading(true);
      try {
        const data = await fetchContestById(contestId);
        setContest(data);
        if (data) {
          // Initialize timer to duration
          setSecondsRemaining(data.durationMinutes * 60);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    void loadContest();
  }, [contestId]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalPoints =
    contest?.problems.reduce((sum, p) => sum + (p.points || 0), 0) || 2100;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="font-mono text-xs text-text-dim">Loading contest arena...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-warning mb-4" />
        <h2 className="text-xl font-bold text-text-primary">Contest Not Found</h2>
        <p className="text-sm text-text-muted mt-2 mb-6">
          The requested hardware contest could not be found or has not started yet.
        </p>
        <Link
          href="/contests"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-[#070707]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Contests
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/contests"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-panel text-text-dim hover:text-text-primary hover:border-accent/40 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-accent/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent border border-accent/30">
                #{contest.edition}
              </span>
              <h1 className="text-lg font-bold text-text-primary tracking-tight">
                {contest.title}
              </h1>
            </div>
            <p className="text-xs text-text-dim mt-0.5 line-clamp-1">
              {contest.description}
            </p>
          </div>
        </div>

        {/* Live Timer Banner */}
        <div className="flex items-center gap-4 bg-panel border border-accent/30 shadow-[0_0_20px_rgba(0,217,165,0.08)] rounded-xl px-4 py-2 shrink-0 self-start sm:self-auto">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
            </span>
            <span className="text-[11px] font-mono uppercase text-accent font-bold">
              Time Remaining
            </span>
          </div>
          <div className="font-mono text-xl font-bold tracking-wider text-text-primary">
            {formatTime(secondsRemaining)}
          </div>
        </div>
      </div>

      {/* Contest Overview & Sponsor Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 rounded-2xl border border-border bg-panel p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-40 w-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs text-text-secondary font-mono">
                  <Clock className="h-3.5 w-3.5 text-accent" />
                  {contest.durationMinutes} Minutes Window
                </span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1.5 text-xs text-text-secondary font-mono">
                  <Trophy className="h-3.5 w-3.5 text-warning" />
                  {totalPoints} Total Points
                </span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1.5 text-xs text-text-secondary font-mono">
                  <Users className="h-3.5 w-3.5 text-accent" />
                  {contest.registeredCount.toLocaleString()} Competing
                </span>
              </div>
              <p className="text-xs text-text-muted max-w-2xl leading-relaxed">
                Complete solutions are judged by compiling against cycle-accurate testbenches in Verilator and Icarus Verilog. Fast-forward your clock cycles and optimize latency!
              </p>
            </div>

            {contest.sponsor && (
              <div className="rounded-xl border border-border/70 bg-surface/80 p-3 shrink-0 sm:max-w-[220px]">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="h-4 w-4 text-warning" />
                  <span className="text-xs font-bold text-text-primary">
                    {contest.sponsor.name}
                  </span>
                </div>
                <p className="text-[10px] text-text-dim leading-snug">
                  {contest.sponsor.tagline}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Live Contest Stats Card */}
        <div className="rounded-2xl border border-border bg-panel p-5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-text-dim">
              Your Performance
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-text-primary">
                {solvedSlugs.size} / {contest.problems.length}
              </span>
              <span className="text-xs text-text-dim">Solved</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
            <span className="text-text-muted">Current Score:</span>
            <span className="font-bold text-accent">
              {Array.from(solvedSlugs).reduce((sum, s) => {
                const prob = contest.problems.find((p) => p.slug === s);
                return sum + (prob?.points || 0);
              }, 0)}{" "}
              pts
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("problems")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "problems"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Code2 className="h-4 w-4" />
          <span>Challenge Problems ({contest.problems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "leaderboard"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Live Arena Standings</span>
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "rules"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Rules & Scoring</span>
        </button>
      </div>

      {/* Tab 1: Problems List */}
      {activeTab === "problems" && (
        <div className="space-y-3">
          {contest.problems.map((prob, idx) => {
            const isSolved = solvedSlugs.has(prob.slug);
            return (
              <div
                key={prob.id}
                className="group relative rounded-xl border border-border bg-panel p-5 transition-all hover:border-accent/40 hover:bg-surface/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold ${
                        isSolved
                          ? "bg-success/20 text-success border border-success/30"
                          : "bg-surface border border-border text-text-muted group-hover:border-accent/40 group-hover:text-accent"
                      }`}
                    >
                      {isSolved ? <Check className="h-4 w-4" /> : `Q${idx + 1}`}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Link
                          href={`/problems/${prob.slug}?contest=${contest.id}`}
                          className="text-sm font-bold text-text-primary hover:text-accent transition-colors"
                        >
                          {prob.title}
                        </Link>
                        <DifficultyBadge difficulty={prob.difficulty} size="sm" />
                        <span className="font-mono text-xs font-bold text-accent">
                          {prob.points} pts
                        </span>
                      </div>
                      <p className="text-xs text-text-dim mt-1">
                        SystemVerilog RTL • Verified with cycle-accurate test suite
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/problems/${prob.slug}?contest=${contest.id}`}
                      className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-[#070707] hover:bg-accent-hover transition-all shadow-md active:scale-95"
                    >
                      <span>{isSolved ? "Review Code" : "Solve Problem"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Live Leaderboard */}
      {activeTab === "leaderboard" && (
        <div className="rounded-xl border border-border bg-panel overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" />
              <span>Real-Time Contest Standings</span>
            </h3>
            <span className="text-[11px] font-mono text-text-dim">
              Refreshed every 10s • Latency Penalty applied
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-mono uppercase text-text-dim">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4 text-center">Solved</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Time</th>
                  <th className="py-3 px-4 text-center">Penalty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {MOCK_CONTEST_LEADERBOARD.map((entry) => (
                  <tr
                    key={entry.rank}
                    className="hover:bg-surface/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold">
                      {entry.rank === 1 ? (
                        <span className="inline-flex items-center gap-1 text-warning">
                          <Flame className="h-3.5 w-3.5" /> #1
                        </span>
                      ) : entry.rank === 2 ? (
                        <span className="text-text-primary">#2</span>
                      ) : entry.rank === 3 ? (
                        <span className="text-amber-500">#3</span>
                      ) : (
                        <span className="text-text-dim">#{entry.rank}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-text-primary">
                        {entry.displayName || entry.username}
                      </div>
                      <div className="font-mono text-[10px] text-text-dim">
                        @{entry.username}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-text-primary">
                      {entry.problemsSolved} / 4
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-accent">
                      {entry.score}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-text-dim">
                      {Math.floor(entry.finishTimeSeconds / 60)}m {entry.finishTimeSeconds % 60}s
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-warning">
                      +{entry.penaltyMinutes}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Contest Rules */}
      {activeTab === "rules" && (
        <div className="rounded-xl border border-border bg-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <span>Contest Rules & Submission Policies</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-text-muted leading-relaxed">
            <div className="space-y-2 rounded-lg border border-border bg-surface/50 p-4">
              <h4 className="font-bold text-text-primary flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-accent" /> Timing & Penalty
              </h4>
              <p>
                Contests run for a fixed duration. Each incorrect submission that fails verification incurs a <strong>5-minute time penalty</strong> upon final acceptance.
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-surface/50 p-4">
              <h4 className="font-bold text-text-primary flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-warning" /> Simulator Verification
              </h4>
              <p>
                Designs must synthesize and pass all cycle-level assertions. Verilator and Icarus Verilog outputs are checked against reference behaviors.
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-surface/50 p-4">
              <h4 className="font-bold text-text-primary flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Scoring Breakdown
              </h4>
              <p>
                Points are awarded per problem difficulty: Easy (250-350 pts), Medium (500-600 pts), Hard (750-1000 pts). Full credit requires 100% testbench pass rate.
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-surface/50 p-4">
              <h4 className="font-bold text-text-primary flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-accent" /> Rating Updates & Referrals
              </h4>
              <p>
                Rating calculations are updated within 1 hour post-contest. High-ranking solutions are reviewed by semiconductor partner hiring managers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
