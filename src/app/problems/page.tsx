"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchProblems, fetchDailyChallenge, fetchUserDashboard } from "@/lib/api";
import { Problem, DailyChallenge } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import DifficultyBadge from "@/components/DifficultyBadge";
import {
  Search,
  Code2,
  Cpu,
  Layers,
  Zap,
  Activity,
  Database,
  Radio,
  SlidersHorizontal,
  Boxes,
  Flame,
  Calendar as CalendarIcon,
  Building2,
  ArrowRight,
  Sparkles,
  Trophy,
  Shuffle,
  CheckCircle2,
  Circle,
  FileText,
  Bookmark,
  ChevronRight,
  TrendingUp,
  Award,
  Filter,
  Check,
  Plus,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Topics" },
  { id: "chip-design", label: "Chip Design & Standard Cells", icon: Boxes },
  { id: "combinational", label: "Combinational Logic", icon: Zap },
  { id: "sequential", label: "Sequential Logic", icon: Activity },
  { id: "fsm", label: "Finite State Machines", icon: SlidersHorizontal },
  { id: "arithmetic", label: "Arithmetic & ALUs", icon: Cpu },
  { id: "memory", label: "Memory & FIFOs", icon: Database },
  { id: "protocols", label: "Bus Protocols", icon: Radio },
];

const COMPANIES = [
  "All Companies",
  "NVIDIA",
  "Apple",
  "Intel",
  "Qualcomm",
  "AMD",
  "Google",
  "ARM",
  "Texas Instruments",
];

const STUDY_PLANS = [
  {
    id: "silicon-75",
    title: "Top Silicon 75",
    description: "Must-do hardware RTL questions for ASIC & FPGA interviews.",
    total: 75,
    completed: 4,
    badge: "Most Popular",
    color: "from-emerald-500/20 to-teal-500/5",
    border: "border-emerald-500/30",
  },
  {
    id: "nvidia-apple",
    title: "NVIDIA & Apple Silicon",
    description: "Real questions asked by microarchitecture & GPU teams.",
    total: 30,
    completed: 2,
    badge: "Company Track",
    color: "from-amber-500/20 to-orange-500/5",
    border: "border-amber-500/30",
  },
  {
    id: "verilog-101",
    title: "Digital Design 101",
    description: "Combinational, counters, clock domain crossings, and FIFOs.",
    total: 20,
    completed: 5,
    badge: "Fundamentals",
    color: "from-sky-500/20 to-blue-500/5",
    border: "border-sky-500/30",
  },
];

export default function ProblemsPage() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [daily, setDaily] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState("All Companies");
  const [statusFilter, setStatusFilter] = useState("all");

  const { user } = useAuth();
  const [solvedSlugs, setSolvedSlugs] = useState<Set<string>>(new Set());
  const [solvedStats, setSolvedStats] = useState({
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  });

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => {
        setSolvedSlugs(new Set());
        setSolvedStats({ total: 0, easy: 0, medium: 0, hard: 0 });
      });
      return;
    }

    async function loadUserStats() {
      try {
        const data = await fetchUserDashboard();
        if (data) {
          const slugs = new Set(
            (data.problemProgress || [])
              .filter((p) => p.status === "SOLVED")
              .map((p) => p.slug)
          );
          setSolvedSlugs(slugs);
          const easy = data.difficultyStats.find((d) => d.difficulty.toLowerCase() === "easy")?.solved || 0;
          const medium = data.difficultyStats.find((d) => d.difficulty.toLowerCase() === "medium")?.solved || 0;
          const hard = data.difficultyStats.find((d) => d.difficulty.toLowerCase() === "hard")?.solved || 0;
          setSolvedStats({
            total: data.problemsSolved,
            easy,
            medium,
            hard,
          });
        }
      } catch {
        // Ignore
      }
    }
    queueMicrotask(() => void loadUserStats());
  }, [user]);

  const loadProblems = useCallback(async () => {
    setLoading(true);
    try {
      const [data, dailyData] = await Promise.all([
        fetchProblems({
          difficulty: difficulty !== "all" ? difficulty : undefined,
          category: category !== "all" ? category : undefined,
          search: search || undefined,
        }),
        fetchDailyChallenge().catch(() => null),
      ]);
      setProblems(data.problems);
      if (dailyData) setDaily(dailyData);
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  }, [difficulty, category, search]);

  useEffect(() => {
    queueMicrotask(() => void loadProblems());
  }, [loadProblems]);

  // Client-side company and status filtering
  const filteredProblems = problems.filter((p) => {
    if (selectedCompany !== "All Companies") {
      if (!p.companyTags || p.companyTags.length === 0) return false;
      const matches = p.companyTags.some(
        (comp) => comp.toLowerCase() === selectedCompany.toLowerCase()
      );
      if (!matches) return false;
    }
    if (statusFilter === "solved") {
      if (!solvedSlugs.has(p.slug)) return false;
    } else if (statusFilter === "unsolved") {
      if (solvedSlugs.has(p.slug)) return false;
    }
    return true;
  });

  // Pick Random Problem (iconic LeetCode Pick One)
  const handlePickRandom = () => {
    if (filteredProblems.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredProblems.length);
      const randomProblem = filteredProblems[randomIndex];
      router.push(`/problems/${randomProblem.slug}`);
    }
  };

  // Counts
  const totalCount = filteredProblems.length;
  const easyCount = filteredProblems.filter((p) => p.difficulty === "easy").length;
  const mediumCount = filteredProblems.filter((p) => p.difficulty === "medium").length;
  const hardCount = filteredProblems.filter((p) => p.difficulty === "hard").length;

  const solvedCount = solvedStats.total;
  const solvedEasy = solvedStats.easy;
  const solvedMed = solvedStats.medium;
  const solvedHard = solvedStats.hard;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      {/* 1. Top LeetCode Study Plans Carousel */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {STUDY_PLANS.map((plan) => {
          const planCompleted = plan.id === "silicon-75"
            ? Math.min(solvedCount, 75)
            : plan.id === "nvidia-apple"
            ? filteredProblems.filter((p) => p.companyTags?.some(c => c === "NVIDIA" || c === "Apple") && solvedSlugs.has(p.slug)).length
            : Math.min(solvedCount, 20);

          return (
            <div
              key={plan.id}
              className={`group relative overflow-hidden rounded-2xl border ${plan.border} bg-gradient-to-br ${plan.color} p-4.5 transition-all hover:scale-[1.01] hover:shadow-lg`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-md bg-panel/80 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-text-primary border border-border">
                  {plan.badge}
                </span>
                <span className="text-xs font-mono font-semibold text-text-dim">
                  {planCompleted}/{plan.total} Solved
                </span>
              </div>
              <h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                {plan.title}
              </h3>
              <p className="mt-1 text-xs text-text-muted line-clamp-2 leading-relaxed">
                {plan.description}
              </p>
              {/* Progress bar */}
              <div className="mt-3.5 flex items-center gap-3">
                <div className="h-1.5 flex-1 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${(planCompleted / plan.total) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-text-primary">
                  {Math.round((planCompleted / plan.total) * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. LeetCode Daily Challenge Banner */}
      {daily && (
        <div className="mb-6 relative overflow-hidden rounded-2xl border border-border bg-panel p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 text-accent shadow-[0_0_16px_rgba(0,217,165,0.25)]">
                <Flame className="h-5 w-5 text-accent animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-accent border border-accent/20">
                    Daily Question
                  </span>
                  <span className="text-xs font-mono text-text-dim flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {daily.date}
                  </span>
                  <span className="rounded-full bg-warning/10 border border-warning/25 px-2 py-0.5 text-[10px] font-bold text-warning flex items-center gap-1">
                    🔥 {daily.streak} Day Streak
                  </span>
                  <span className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-mono text-text-muted border border-border">
                    +50 XP
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-bold text-text-primary">
                  {daily.problem.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <DifficultyBadge difficulty={daily.problem.difficulty} size="sm" />
              <Link
                href={`/problems/${daily.problem.slug}`}
                className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-fg transition-all hover:bg-accent-hover shadow-sm active:scale-95"
              >
                <span>Solve Today</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Split Layout: Problems Table (Left) + LeetCode Widgets (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Problem Filters & Table */}
        <div className="lg:col-span-8 space-y-4">
          {/* Category Topics Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-text-primary text-background font-semibold shadow-sm"
                      : "bg-panel text-text-secondary border border-border hover:bg-surface hover:text-text-primary"
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search, Filter Dropdowns, and "Pick One" Button */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-dim" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions by name, logic or interface..."
                  className="h-9 w-full rounded-xl border border-border bg-panel pl-9 pr-3 text-xs text-text-primary placeholder-text-dim outline-none transition-all focus:border-accent/40"
                />
              </div>

              {/* Difficulty Dropdown */}
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="h-9 rounded-xl border border-border bg-panel px-3 text-xs font-medium text-text-secondary outline-none hover:border-text-dim transition-colors"
              >
                <option value="all">Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              {/* Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-xl border border-border bg-panel px-3 text-xs font-medium text-text-secondary outline-none hover:border-text-dim transition-colors hidden sm:block"
              >
                <option value="all">Status</option>
                <option value="todo">Todo</option>
                <option value="solved">Solved</option>
                <option value="attempted">Attempted</option>
              </select>
            </div>

            {/* Admin Add Problem Button */}
            {user?.isAdmin && (
              <Link
                href="/admin?tab=problems&create=true"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-warning/50 bg-warning/15 px-3.5 py-2 text-xs font-bold text-warning transition-all hover:bg-warning/25 active:scale-95 shrink-0 shadow-sm"
                title="Create a new problem in the catalog"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Problem</span>
              </Link>
            )}

            {/* Iconic LeetCode "Pick One" Random Button */}
            <button
              onClick={handlePickRandom}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-2 text-xs font-bold text-accent transition-all hover:bg-accent/20 active:scale-95 shrink-0"
              title="Pick a random hardware problem"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>Pick One</span>
            </button>
          </div>

          {/* Company Tags Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] uppercase font-mono font-bold text-text-dim shrink-0 mr-1">
              Companies:
            </span>
            {COMPANIES.map((comp) => {
              const isSelected = selectedCompany === comp;
              return (
                <button
                  key={comp}
                  onClick={() => setSelectedCompany(comp)}
                  className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-mono transition-all ${
                    isSelected
                      ? "bg-accent/20 text-accent border border-accent/40 font-bold"
                      : "bg-surface/60 text-text-dim border border-border hover:text-text-secondary hover:border-text-dim"
                  }`}
                >
                  {comp}
                </button>
              );
            })}
          </div>

          {/* 4. LeetCode Style Problems Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-panel shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface/50 text-[11px] font-semibold text-text-dim">
                    <th className="w-12 px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="w-24 px-4 py-3 text-center hidden sm:table-cell">Solution</th>
                    <th className="w-28 px-4 py-3 text-center">Acceptance</th>
                    <th className="w-24 px-4 py-3 text-center">Difficulty</th>
                    <th className="w-36 px-4 py-3 text-right pr-5 hidden md:table-cell">
                      Companies
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-muted">
                        <div className="flex items-center justify-center gap-2">
                          <Cpu className="h-4 w-4 animate-spin text-accent" />
                          <span>Loading hardware problem set...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProblems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-muted">
                        <Code2 className="mx-auto mb-2 h-7 w-7 text-text-dim" />
                        <p className="font-semibold text-text-primary">No problems found</p>
                        <p className="text-[11px] text-text-dim">Try clearing the search or filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProblems.map((problem, idx) => {
                      const isChip =
                        problem.category?.toLowerCase().includes("chip") ||
                        problem.slug.includes("chip");
                      const isSolved = solvedSlugs.has(problem.slug);

                      return (
                        <tr
                          key={problem.slug}
                          className="group transition-colors hover:bg-surface/70 cursor-pointer"
                          onClick={() => router.push(`/problems/${problem.slug}`)}
                        >
                          {/* Status Icon */}
                          <td className="px-4 py-3.5 text-center">
                            {isSolved ? (
                              <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-700 dark:text-[#00B8A3]" />
                            ) : (
                              <Circle className="mx-auto h-3.5 w-3.5 text-text-dim/60 group-hover:text-text-dim" />
                            )}
                          </td>

                          {/* Problem Title */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-text-primary group-hover:text-accent transition-colors">
                                {idx + 1}. {problem.title}
                              </span>

                              {isChip && (
                                <span className="rounded bg-accent/15 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase text-accent border border-accent/25">
                                  Standard Cells
                                </span>
                              )}

                              {problem.locked && (
                                <span className="rounded bg-surface px-1.5 py-0.2 text-[9px] font-mono text-text-dim border border-border">
                                  PRO
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Solution / Editorial */}
                          <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                            <div className="flex justify-center text-text-dim group-hover:text-accent transition-colors">
                              <FileText className="h-3.5 w-3.5" />
                            </div>
                          </td>

                          {/* Acceptance Rate */}
                          <td className="px-4 py-3.5 text-center font-mono text-text-secondary">
                            {problem.acceptanceRate
                              ? `${problem.acceptanceRate}%`
                              : `${(72 + (idx * 4.7) % 20).toFixed(1)}%`}
                          </td>

                          {/* Difficulty Badge */}
                          <td className="px-4 py-3.5 text-center">
                            <DifficultyBadge difficulty={problem.difficulty} size="sm" />
                          </td>

                          {/* Company Tags */}
                          <td className="px-4 py-3.5 text-right pr-5 hidden md:table-cell">
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              {problem.companyTags && problem.companyTags.length > 0 ? (
                                problem.companyTags.slice(0, 2).map((comp) => (
                                  <span
                                    key={comp}
                                    className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-mono text-text-muted border border-border"
                                  >
                                    {comp}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] font-mono text-text-dim">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): LeetCode Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-5">
          {/* Widget 1: Session Progress Donut Card */}
          <div className="rounded-2xl border border-border bg-panel p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-dim mb-4 flex items-center justify-between">
              <span>Session Progress</span>
              <span className="text-[11px] font-mono text-accent">Active</span>
            </h4>

            <div className="flex items-center gap-6">
              {/* Circular Progress Ring */}
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    className="stroke-surface"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Progress circle */}
                  <path
                    className="stroke-accent transition-all duration-1000"
                    strokeWidth="3.5"
                    strokeDasharray={`${(solvedCount / Math.max(1, totalCount)) * 100}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-text-primary">{solvedCount}</span>
                  <span className="text-[9px] font-mono uppercase text-text-dim">
                    /{totalCount} Solved
                  </span>
                </div>
              </div>

              {/* Breakdown Bars */}
              <div className="flex-1 space-y-2 text-xs">
                {/* Easy */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-emerald-700 dark:text-[#00B8A3]">Easy</span>
                    <span className="font-mono text-text-muted">
                      {solvedEasy}/{easyCount}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 dark:bg-[#00B8A3] rounded-full"
                      style={{ width: `${(solvedEasy / Math.max(1, easyCount)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Medium */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-amber-700 dark:text-[#FFC01E]">Medium</span>
                    <span className="font-mono text-text-muted">
                      {solvedMed}/{mediumCount}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full bg-amber-500 dark:bg-[#FFC01E] rounded-full"
                      style={{ width: `${(solvedMed / Math.max(1, mediumCount)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Hard */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-rose-700 dark:text-[#FF375F]">Hard</span>
                    <span className="font-mono text-text-muted">
                      {solvedHard}/{hardCount}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full bg-rose-500 dark:bg-[#FF375F] rounded-full"
                      style={{ width: `${(solvedHard / Math.max(1, hardCount)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: LeetCode Style Calendar & Streak Widget */}
          <div className="rounded-2xl border border-border bg-panel p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-accent" />
                <h4 className="text-xs font-bold text-text-primary">Daily Streak Calendar</h4>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-warning">
                <Flame className="h-3.5 w-3.5" />
                <span>4 Days</span>
              </div>
            </div>

            {/* Mini Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono mb-2">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i} className="text-text-dim py-1 font-semibold">
                  {d}
                </span>
              ))}
              {Array.from({ length: 28 }).map((_, i) => {
                const day = i + 1;
                const isStreak = day >= 19 && day <= 22; // current 4 day streak
                return (
                  <div
                    key={i}
                    className={`flex h-7 items-center justify-center rounded-lg font-mono text-[10px] transition-all ${
                      isStreak
                        ? "bg-accent/20 text-accent font-bold border border-accent/40 shadow-[0_0_8px_rgba(0,217,165,0.15)]"
                        : "bg-surface/50 text-text-dim hover:bg-surface"
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-text-dim text-center mt-2">
              Complete today&apos;s problem to extend your hardware streak!
            </p>
          </div>

          {/* Widget 3: Trending Hardware Companies */}
          <div className="rounded-2xl border border-border bg-panel p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-accent" />
              <h4 className="text-xs font-bold text-text-primary">Trending Companies</h4>
            </div>

            <div className="space-y-2">
              {[
                { name: "NVIDIA", count: 18, highlight: "GPU & AI Accelerators" },
                { name: "Apple Silicon", count: 14, highlight: "M-Series & Neural Engine" },
                { name: "Intel", count: 12, highlight: "Core & Xeon Microarch" },
                { name: "Qualcomm", count: 10, highlight: "Snapdragon DSP & RTL" },
                { name: "AMD", count: 8, highlight: "Zen & RDNA Architecture" },
                { name: "Google Silicon", count: 6, highlight: "TPU & Custom Silicon" },
              ].map((comp) => (
                <button
                  key={comp.name}
                  onClick={() => setSelectedCompany(comp.name.split(" ")[0])}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-surface/40 p-2.5 text-xs transition-all hover:border-accent/40 hover:bg-surface"
                >
                  <div className="text-left">
                    <span className="font-semibold text-text-primary block leading-tight">
                      {comp.name}
                    </span>
                    <span className="text-[10px] text-text-dim">{comp.highlight}</span>
                  </div>
                  <span className="rounded-md bg-panel px-2 py-0.5 text-[11px] font-mono text-accent border border-border font-semibold">
                    {comp.count} Qs
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
