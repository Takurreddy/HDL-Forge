"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchProblemBySlug,
  fetchProblems,
  fetchWaveform,
  fetchProblemSubmissions,
  fetchDiscussions,
  createDiscussion,
  voteDiscussion,
  fetchSolutions,
  createSolution,
  voteSolution,
  runCode,
  submitCode,
} from "@/lib/api";
import {
  Problem,
  SubmissionResult,
  WaveformData,
  AchievementInfo,
  ProblemSubmission,
  Discussion,
  CommunitySolution,
} from "@/lib/types";
import { useAuth } from "@/lib/auth";
import CodeEditor from "@/components/CodeEditor";
import Console from "@/components/Console";
import DifficultyBadge from "@/components/DifficultyBadge";
import CategoryBadge from "@/components/CategoryBadge";
import AIAssistant from "@/components/AIAssistant";
import { WaveformViewer } from "@/components/waveform";
import {
  Play,
  Send,
  FileText,
  Lock,
  ChevronLeft,
  ChevronRight,
  Zap,
  Trophy,
  ArrowLeft,
  BookOpen,
  Clock,
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  XCircle,
  History,
  RotateCcw,
  Sparkles,
  Terminal,
  Code,
  List,
  Cpu,
  Shuffle,
  Timer,
  Pause,
  Building2,
  Tag,
  ThumbsDown,
  Star,
  Share2,
  Flame,
  Copy,
} from "lucide-react";
import ChipSchematic from "@/components/ChipSchematic";
import ThemeToggle from "@/components/ThemeToggle";

type LeftTab = "description" | "schematic" | "submissions" | "solution" | "discussion";
type EditorTab = "design" | "testbench";

export default function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor states
  const [code, setCode] = useState("");
  const [testbenchCode, setTestbenchCode] = useState("");
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTab>("design");

  // Execution states
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<LeftTab>("description");

  // Waveform states
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [waveformLoading, setWaveformLoading] = useState(false);
  const [waveformError, setWaveformError] = useState<string | null>(null);
  const [showWaveform, setShowWaveform] = useState(false);
  const waveformLoadedRef = useRef<string | null>(null);

  // Gamification states
  const [xpNotification, setXpNotification] = useState<{
    xpEarned: number;
    xpTotal: number;
    level: number;
    achievements: AchievementInfo[];
  } | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Submissions & Discussions
  const [submissions, setSubmissions] = useState<ProblemSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState("");
  const [postingDiscussion, setPostingDiscussion] = useState(false);

  // Solutions state (LeetCode Community & Editorial)
  const [solutions, setSolutions] = useState<CommunitySolution[]>([]);
  const [solutionsLoading, setSolutionsLoading] = useState(false);
  const [solutionTab, setSolutionTab] = useState<"editorial" | "community">("editorial");
  const [showPostSolution, setShowPostSolution] = useState(false);
  const [newSolutionTitle, setNewSolutionTitle] = useState("");
  const [newSolutionApproach, setNewSolutionApproach] = useState("");
  const [newSolutionCode, setNewSolutionCode] = useState("");
  const [newSolutionTags, setNewSolutionTags] = useState("SystemVerilog, Clean RTL");
  const [postingSolution, setPostingSolution] = useState(false);
  const [postSolutionSuccess, setPostSolutionSuccess] = useState(false);

  // LeetCode Interview Timer & Social Actions
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [likes, setLikes] = useState(148);
  const [userLiked, setUserLiked] = useState<boolean | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [showCompanies, setShowCompanies] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Fetch problem & problem list for prev/next
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [p, listRes] = await Promise.all([
          fetchProblemBySlug(slug),
          fetchProblems().catch(() => ({ problems: [], total: 0 })),
        ]);
        if (!cancelled) {
          setProblem(p);
          setCode(p.starterCode);
          setTestbenchCode(p.publicTestbenches?.[0]?.testbench || "");
          setAllProblems(listRes.problems || []);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load problem. Please check your backend connection.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Waveform Loader
  const loadWaveform = useCallback(async (wfId: string) => {
    setWaveformLoading(true);
    setWaveformError(null);
    try {
      const data = await fetchWaveform(wfId);
      setWaveformData(data);
      setShowWaveform(true);
    } catch (err) {
      setWaveformError(err instanceof Error ? err.message : "Failed to load waveform");
    } finally {
      setWaveformLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      result?.waveformId &&
      !waveformLoading &&
      !waveformData &&
      waveformLoadedRef.current !== result.waveformId
    ) {
      waveformLoadedRef.current = result.waveformId;
      loadWaveform(result.waveformId);
    }
  }, [result, waveformLoading, waveformData, loadWaveform]);

  // Load Submissions
  const loadSubmissions = useCallback(async () => {
    if (!problem) return;
    setSubmissionsLoading(true);
    try {
      const data = await fetchProblemSubmissions(problem.slug);
      setSubmissions(data);
    } catch {
      // ignore
    } finally {
      setSubmissionsLoading(false);
    }
  }, [problem]);

  // Load Discussions
  const loadDiscussions = useCallback(async () => {
    if (!problem) return;
    setDiscussionsLoading(true);
    try {
      const data = await fetchDiscussions(problem.slug);
      setDiscussions(data);
    } catch {
      // ignore
    } finally {
      setDiscussionsLoading(false);
    }
  }, [problem]);

  // Load Solutions
  const loadSolutions = useCallback(async () => {
    if (!problem) return;
    setSolutionsLoading(true);
    try {
      const data = await fetchSolutions(problem.slug);
      setSolutions(data);
    } catch {
      // ignore
    } finally {
      setSolutionsLoading(false);
    }
  }, [problem]);

  useEffect(() => {
    if (activeTab === "submissions") void loadSubmissions();
    if (activeTab === "discussion") void loadDiscussions();
    if (activeTab === "solution") void loadSolutions();
  }, [activeTab, loadSubmissions, loadDiscussions, loadSolutions]);

  const handlePostSolution = async () => {
    if (!problem || !newSolutionTitle.trim() || !newSolutionCode.trim()) return;
    setPostingSolution(true);
    try {
      await createSolution(problem.slug, {
        title: newSolutionTitle,
        content: newSolutionApproach,
        code: newSolutionCode,
        language: "SystemVerilog",
        tags: newSolutionTags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setPostSolutionSuccess(true);
      setTimeout(() => {
        setShowPostSolution(false);
        setPostSolutionSuccess(false);
        setNewSolutionTitle("");
        setNewSolutionApproach("");
      }, 1500);
      await loadSolutions();
      setSolutionTab("community");
    } catch {
      // ignore
    } finally {
      setPostingSolution(false);
    }
  };

  const handleVoteSolution = async (id: number, currentUpvotes: number) => {
    try {
      const res = await voteSolution(id, 1);
      setSolutions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, upvotes: res.upvotes } : s))
      );
    } catch {
      setSolutions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, upvotes: currentUpvotes + 1 } : s))
      );
    }
  };

  // Reset Code
  const handleResetCode = () => {
    if (!problem) return;
    if (confirm("Reset current code to starter code?")) {
      setCode(problem.starterCode);
    }
  };

  // Run Code
  const handleRun = useCallback(async () => {
    if (!problem || isRunning) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/problems/${problem.slug}`)}`);
      return;
    }
    setIsRunning(true);
    setResult(null);
    setWaveformData(null);
    setShowWaveform(false);
    setWaveformError(null);
    setXpNotification(null);
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    try {
      const res = await runCode({
        problemSlug: problem.slug,
        language: problem.language,
        code,
        testbenchCode: activeEditorTab === "testbench" ? testbenchCode : undefined,
      });
      setResult(res);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to connect to the HDLForge server.";
      setResult({
        status: "error",
        compilationMessage: message,
        tests: [],
        score: 0,
        testsPassed: 0,
        testsTotal: 0,
        executionTime: 0,
        xpEarned: 0,
        xpTotal: 0,
        level: 1,
        progressStatus: null,
        achievementsUnlocked: [],
      });
    } finally {
      setIsRunning(false);
    }
  }, [problem, isRunning, code, testbenchCode, activeEditorTab, user, router]);

  // Submit Code
  const handleSubmit = useCallback(async () => {
    if (!problem || isRunning) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/problems/${problem.slug}`)}`);
      return;
    }
    setIsRunning(true);
    setResult(null);
    setWaveformData(null);
    setShowWaveform(false);
    setWaveformError(null);
    setXpNotification(null);
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    try {
      const res = await submitCode({
        problemSlug: problem.slug,
        language: problem.language,
        code,
        testbenchCode: activeEditorTab === "testbench" ? testbenchCode : undefined,
      });
      setResult(res);
      void loadSubmissions();
      if (res.xpEarned > 0 || res.achievementsUnlocked.length > 0) {
        setXpNotification({
          xpEarned: res.xpEarned,
          xpTotal: res.xpTotal,
          level: res.level,
          achievements: res.achievementsUnlocked,
        });
        notificationTimeoutRef.current = setTimeout(() => setXpNotification(null), 6000);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to connect to the HDLForge server.";
      setResult({
        status: "error",
        compilationMessage: message,
        tests: [],
        score: 0,
        testsPassed: 0,
        testsTotal: 0,
        executionTime: 0,
        xpEarned: 0,
        xpTotal: 0,
        level: 1,
        progressStatus: null,
        achievementsUnlocked: [],
      });
    } finally {
      setIsRunning(false);
    }
  }, [problem, isRunning, code, testbenchCode, activeEditorTab, user, router]);

  // Keyboard Shortcuts: Ctrl+Enter (Run), Ctrl+Shift+Enter (Submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          void handleSubmit();
        } else {
          void handleRun();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRun, handleSubmit]);

  const handlePostDiscussion = async () => {
    if (!problem || !newDiscussion.trim()) return;
    setPostingDiscussion(true);
    try {
      await createDiscussion(problem.slug, newDiscussion.trim());
      setNewDiscussion("");
      await loadDiscussions();
    } catch {
      // ignore
    } finally {
      setPostingDiscussion(false);
    }
  };

  const handleVote = async (discussionId: number, vote: number) => {
    try {
      await voteDiscussion(discussionId, vote);
      await loadDiscussions();
    } catch {
      // ignore
    }
  };

  // Next / Prev Problem Navigation
  const currentIdx = allProblems.findIndex((p) => p.slug === slug);
  const prevProblem = currentIdx > 0 ? allProblems[currentIdx - 1] : null;
  const nextProblem =
    currentIdx >= 0 && currentIdx < allProblems.length - 1 ? allProblems[currentIdx + 1] : null;

  const isSolved = result?.status === "PASSED" || result?.progressStatus === "SOLVED";

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3rem)] flex-col items-center justify-center gap-3 bg-background">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-xs font-mono text-text-muted">Loading problem workspace...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="flex h-[calc(100vh-3rem)] flex-col items-center justify-center gap-4 bg-background">
        <div className="rounded-xl border border-border bg-panel p-8 text-center max-w-md">
          <XCircle className="mx-auto mb-3 h-10 w-10 text-error" />
          <h1 className="text-base font-bold text-text-primary mb-1">{error || "Problem not found"}</h1>
          <p className="text-xs text-text-muted mb-6">
            The problem could not be loaded from the backend database.
          </p>
          <Link
            href="/problems"
            className="inline-flex h-8 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-semibold text-[#070707] transition-all hover:bg-accent-hover"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Problems Catalog
          </Link>
        </div>
      </div>
    );
  }

  const isChipProblem =
    problem.category?.toLowerCase().includes("chip") ||
    problem.slug.includes("chip") ||
    problem.category?.toLowerCase().includes("arithmetic") ||
    problem.category?.toLowerCase().includes("combinational") ||
    problem.category?.toLowerCase().includes("sequential");

  const leftTabs: { key: LeftTab; label: string; icon: typeof FileText }[] = [
    { key: "description", label: "Description", icon: FileText },
    ...(isChipProblem
      ? [{ key: "schematic" as LeftTab, label: "Chip Schematic & Parts", icon: Cpu }]
      : []),
    { key: "submissions", label: "Submissions", icon: History },
    { key: "solution", label: "Solution", icon: BookOpen },
    { key: "discussion", label: "Discussion", icon: MessageSquare },
  ];

  const problemIndex = allProblems.findIndex((p) => p.slug === slug);
  const problemNumber = problemIndex >= 0 ? problemIndex + 1 : 1;

  const handlePickRandom = () => {
    if (allProblems.length > 0) {
      const otherProblems = allProblems.filter((p) => p.slug !== slug);
      if (otherProblems.length > 0) {
        const random = otherProblems[Math.floor(Math.random() * otherProblems.length)];
        router.push(`/problems/${random.slug}`);
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col bg-background relative overflow-hidden select-none">
      {/* Top LeetCode-Style Global Toolbar */}
      <header className="flex h-11 items-center justify-between border-b border-border bg-panel/95 px-4 backdrop-blur-md z-20">
        {/* Left: Navigation, Random Pick & Problem Number */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/problems"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            title="Back to Problem List"
          >
            <List className="h-3.5 w-3.5 text-accent" />
            <span className="hidden sm:inline font-medium">Problem List</span>
          </Link>

          <div className="h-4 w-px bg-border" />

          {/* Prev / Next / Random Pick */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => prevProblem && router.push(`/problems/${prevProblem.slug}`)}
              disabled={!prevProblem}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
              title={prevProblem ? `Previous: ${prevProblem.title}` : "No previous problem"}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => nextProblem && router.push(`/problems/${nextProblem.slug}`)}
              disabled={!nextProblem}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
              title={nextProblem ? `Next: ${nextProblem.title}` : "No next problem"}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={handlePickRandom}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-accent"
              title="Pick a random problem (Shuffle)"
            >
              <Shuffle className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-primary truncate max-w-[160px] sm:max-w-xs">
              {problemNumber}. {problem.title}
            </span>
            {isSolved && (
              <span className="flex items-center gap-1 rounded-full bg-[#00B8A3]/10 px-2 py-0.2 text-[10px] font-semibold text-[#00B8A3] border border-[#00B8A3]/20">
                <CheckCircle2 className="h-3 w-3" />
                Solved
              </span>
            )}
            <DifficultyBadge difficulty={problem.difficulty} size="sm" />
          </div>
        </div>

        {/* Center: Run, Submit, and LeetCode Interview Stopwatch */}
        <div className="flex items-center gap-2">
          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={isRunning || problem.locked}
            className="group flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1 text-xs font-semibold text-text-primary border border-border transition-all hover:border-accent/40 hover:bg-surface/80 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Run public test cases (Ctrl + Enter)"
          >
            <Play className="h-3.5 w-3.5 text-accent fill-accent" />
            <span>Run</span>
            <kbd className="hidden md:inline rounded bg-panel px-1 py-0.2 text-[9px] font-mono text-text-dim border border-border">
              Ctrl+↵
            </kbd>
          </button>

          {/* Submit Button (Iconic LeetCode Emerald) */}
          <button
            onClick={handleSubmit}
            disabled={isRunning || problem.locked}
            className="flex items-center gap-1.5 rounded-lg bg-[#00B8A3] px-3.5 py-1 text-xs font-bold text-white transition-all hover:bg-[#00B8A3]/90 hover:shadow-[0_0_16px_rgba(0,184,163,0.35)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            title="Submit solution to all test cases (Ctrl + Shift + Enter)"
          >
            <Send className="h-3 w-3" />
            <span>Submit</span>
            <kbd className="hidden md:inline rounded bg-black/20 px-1 py-0.2 text-[9px] font-mono text-white/80">
              Ctrl+⇧+↵
            </kbd>
          </button>

          {/* LeetCode Interview Stopwatch Timer */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-surface/60 px-2.5 py-1 text-xs font-mono font-medium text-text-muted">
            <Timer className="h-3.5 w-3.5 text-text-dim" />
            <span>{formatTimer(timerSeconds)}</span>
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="text-text-dim hover:text-text-primary ml-0.5"
              title={timerRunning ? "Pause Timer" : "Resume Timer"}
            >
              {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </button>
            <button
              onClick={() => setTimerSeconds(0)}
              className="text-text-dim hover:text-text-primary"
              title="Reset Timer"
            >
              <RotateCcw className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>

        {/* Right: Quick Tools (Waveform, Reset, Theme, Profile) */}
        <div className="flex items-center gap-2">
          {/* Waveform toggle button */}
          {(result?.waveformId || waveformData) && (
            <button
              onClick={() => {
                if (result?.waveformId && !waveformData) {
                  loadWaveform(result.waveformId);
                } else {
                  setShowWaveform(!showWaveform);
                }
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                showWaveform
                  ? "bg-accent text-[#070707] shadow-[0_0_12px_rgba(0,217,165,0.3)]"
                  : "bg-surface border border-accent/30 text-accent hover:bg-accent/10"
              }`}
              title="Toggle Waveform Timing Diagram"
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Waveform</span>
            </button>
          )}

          {/* Reset Code */}
          <button
            onClick={handleResetCode}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
            title="Reset code to initial template"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Streak pill */}
          <div
            className="hidden xl:flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-mono font-bold text-warning"
            title="Active Streak"
          >
            <Flame className="h-3 w-3 text-warning animate-bounce" />
            <span>4d</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Split Pane */}
      <div className="flex flex-1 overflow-hidden select-text">
        {/* Left Side: Problem Description / Tabs */}
        <div className="w-full lg:w-[480px] xl:w-[520px] shrink-0 border-r border-border bg-panel flex flex-col overflow-hidden">
          {/* Tabs bar */}
          <div className="flex items-center gap-1 border-b border-border bg-surface/50 px-3 py-1.5">
            {leftTabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  activeTab === key
                    ? "bg-surface text-text-primary font-semibold border border-border shadow-sm"
                    : "text-text-muted hover:text-text-secondary hover:bg-surface/60"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Description Tab */}
            {activeTab === "description" && (
              <div className="space-y-6">
                <div>
                  {/* Problem Title */}
                  <div className="mb-2.5 flex items-center gap-2">
                    <h1 className="text-xl font-black text-text-primary">
                      {problemNumber}. {problem.title}
                    </h1>
                    {problem.locked && <Lock className="h-4 w-4 text-text-dim" />}
                  </div>

                  {/* LeetCode Badges Row */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <DifficultyBadge difficulty={problem.difficulty} size="sm" />
                    
                    <button
                      onClick={() => setShowTopics(!showTopics)}
                      className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-text-secondary border border-border hover:bg-surface/80 transition-colors"
                    >
                      <Tag className="h-3 w-3 text-text-dim" />
                      <span>Topics</span>
                    </button>

                    <button
                      onClick={() => setShowCompanies(!showCompanies)}
                      className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-text-secondary border border-border hover:bg-surface/80 transition-colors"
                    >
                      <Building2 className="h-3 w-3 text-text-dim" />
                      <span>Companies</span>
                    </button>
                  </div>

                  {/* Expandable Topics */}
                  {showTopics && (
                    <div className="mb-3 flex items-center gap-1.5 flex-wrap p-2.5 rounded-xl border border-border bg-surface/40 animate-in fade-in duration-200">
                      <span className="text-[10px] uppercase font-bold text-text-dim mr-1 font-mono">
                        Topics:
                      </span>
                      <span className="rounded bg-panel px-2 py-0.5 text-[10px] font-mono text-text-primary border border-border">
                        {problem.category}
                      </span>
                      <span className="rounded bg-panel px-2 py-0.5 text-[10px] font-mono text-text-primary border border-border">
                        {problem.language.toUpperCase()}
                      </span>
                      <span className="rounded bg-panel px-2 py-0.5 text-[10px] font-mono text-text-primary border border-border">
                        RTL Design
                      </span>
                    </div>
                  )}

                  {/* Expandable Companies */}
                  {showCompanies && (
                    <div className="mb-3 flex items-center gap-1.5 flex-wrap p-2.5 rounded-xl border border-border bg-surface/40 animate-in fade-in duration-200">
                      <span className="text-[10px] uppercase font-bold text-text-dim mr-1 font-mono">
                        Companies:
                      </span>
                      {problem.companyTags && problem.companyTags.length > 0 ? (
                        problem.companyTags.map((comp) => (
                          <span
                            key={comp}
                            className="rounded bg-panel px-2 py-0.5 text-[10px] font-mono font-bold text-accent border border-border"
                          >
                            {comp}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-text-dim">NVIDIA, Apple, Intel</span>
                      )}
                    </div>
                  )}

                  {/* LeetCode Social Action Bar (Like, Dislike, Star, Share) */}
                  <div className="flex items-center gap-4 py-2 border-y border-border/60 text-text-muted text-xs">
                    <button
                      onClick={() => {
                        if (userLiked === true) {
                          setUserLiked(null);
                          setLikes((l) => l - 1);
                        } else {
                          setUserLiked(true);
                          setLikes((l) => l + 1);
                        }
                      }}
                      className={`flex items-center gap-1.5 transition-colors ${
                        userLiked === true ? "text-accent font-semibold" : "hover:text-text-primary"
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>{likes}</span>
                    </button>

                    <button
                      onClick={() => setUserLiked(userLiked === false ? null : false)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        userLiked === false ? "text-error font-semibold" : "hover:text-text-primary"
                      }`}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        isBookmarked ? "text-warning font-semibold" : "hover:text-text-primary"
                      }`}
                      title="Add to Favorite"
                    >
                      <Star className={`h-3.5 w-3.5 ${isBookmarked ? "fill-warning" : ""}`} />
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                      }}
                      className="flex items-center gap-1.5 hover:text-text-primary transition-colors ml-auto"
                      title="Share Question Link"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Standard cell design hint */}
                {isChipProblem && (
                  <div
                    onClick={() => setActiveTab("schematic")}
                    className="cursor-pointer flex items-center justify-between rounded-xl border border-accent/30 bg-accent/10 p-3 hover:bg-accent/15 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Cpu className="h-4 w-4 text-accent" />
                      <div>
                        <span className="text-xs font-bold text-accent block">Standard Cell Parts Available</span>
                        <span className="text-[11px] text-text-muted">
                          Click to open Chip Schematic & Parts to inspect the package layout and copy instance code.
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-accent" />
                  </div>
                )}

                {/* Problem Statement Prose */}
                <div className="prose prose-invert max-w-none text-xs leading-relaxed text-text-secondary">
                  <p>{problem.description}</p>
                </div>

                {/* LeetCode Style Example 1 & Example 2 Inset Blocks */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-text-primary">Example 1:</span>
                    <div className="rounded-xl border border-border bg-surface/50 p-3.5 font-mono text-xs space-y-1.5 text-text-secondary">
                      <div>
                        <strong className="text-text-primary">Input: </strong>
                        <span>{problem.inputDescription || "a = 4'b0101, b = 4'b0011, cin = 1'b0"}</span>
                      </div>
                      <div>
                        <strong className="text-text-primary">Output: </strong>
                        <span className="text-accent">{problem.outputDescription || "sum = 4'b1000, cout = 1'b0"}</span>
                      </div>
                      <div>
                        <strong className="text-text-primary">Explanation: </strong>
                        <span className="text-text-muted">The module executes combinational logic, matching expected standard cell behavior.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complexity targets */}
                {(problem.timeComplexity || problem.spaceComplexity) && (
                  <div className="grid grid-cols-2 gap-3">
                    {problem.timeComplexity && (
                      <div className="rounded-lg border border-border bg-surface p-2.5">
                        <span className="text-[10px] text-text-muted block">Expected Latency</span>
                        <span className="font-mono text-xs font-semibold text-accent">
                          {problem.timeComplexity}
                        </span>
                      </div>
                    )}
                    {problem.spaceComplexity && (
                      <div className="rounded-lg border border-border bg-surface p-2.5">
                        <span className="text-[10px] text-text-muted block">Expected Area / LUTs</span>
                        <span className="font-mono text-xs font-semibold text-accent">
                          {problem.spaceComplexity}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-text-primary">
                      Constraints:
                    </h3>
                    <ul className="space-y-1.5 list-disc pl-4 text-xs text-text-secondary font-mono">
                      {problem.constraints.map((c, i) => (
                        <li key={i}>
                          <span className="rounded bg-surface px-1.5 py-0.2 border border-border text-text-primary">
                            {c}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Chip Schematic & Parts Tab */}
            {activeTab === "schematic" && (
              <ChipSchematic problem={problem} />
            )}

            {/* Submissions Tab */}
            {activeTab === "submissions" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-semibold text-text-primary">Your Submissions</span>
                  <button
                    onClick={loadSubmissions}
                    className="text-[11px] text-accent hover:underline"
                  >
                    Refresh
                  </button>
                </div>
                {submissionsLoading ? (
                  <div className="space-y-2 py-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 animate-pulse rounded-lg bg-surface" />
                    ))}
                  </div>
                ) : submissions.length === 0 ? (
                  <p className="text-xs text-text-dim text-center py-10">
                    No submissions recorded yet. Click Submit to record your solution!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {submissions.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent/30"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-bold ${
                              s.status === "PASSED" ? "text-success" : "text-error"
                            }`}
                          >
                            {s.status}
                          </span>
                          <span className="text-[10px] text-text-dim">
                            {new Date(s.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-text-muted font-mono">
                          <span>Score: {s.score}%</span>
                          <span>
                            Tests: {s.testsPassed}/{s.testsTotal}
                          </span>
                          <span>{(s.executionTime * 1000).toFixed(0)} ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Solution Tab (LeetCode Style: Editorial + Community + Post Solution) */}
            {activeTab === "solution" && (
              <div className="space-y-4">
                {/* Solution Sub-Navigation */}
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSolutionTab("editorial");
                        setShowPostSolution(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        solutionTab === "editorial"
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      Editorial
                    </button>
                    <button
                      onClick={() => setSolutionTab("community")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        solutionTab === "community"
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      <span>Community</span>
                      <span className="rounded-full bg-surface px-1.5 py-0.2 text-[10px] text-text-dim border border-border">
                        {solutions.length}
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSolutionTab("community");
                      setShowPostSolution(!showPostSolution);
                      if (!newSolutionCode) {
                        setNewSolutionCode(code || problem.starterCode || "");
                      }
                    }}
                    className="flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-xs font-bold text-[#070707] transition-all hover:bg-accent-hover shadow-[0_0_10px_rgba(0,217,165,0.2)]"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Share Solution</span>
                  </button>
                </div>

                {/* Inline Post Solution Form */}
                {showPostSolution && (
                  <div className="rounded-xl border border-accent/40 bg-surface/80 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <span className="text-xs font-bold text-accent flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Share Your RTL Solution
                      </span>
                      <button
                        onClick={() => setShowPostSolution(false)}
                        className="text-[11px] text-text-dim hover:text-text-primary"
                      >
                        Cancel
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={newSolutionTitle}
                        onChange={(e) => setNewSolutionTitle(e.target.value)}
                        placeholder="e.g., Clean SystemVerilog with O(1) combinational delay"
                        className="w-full rounded-lg border border-border bg-panel px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">
                        Approach & Microarchitecture Notes
                      </label>
                      <textarea
                        value={newSolutionApproach}
                        onChange={(e) => setNewSolutionApproach(e.target.value)}
                        placeholder="Explain your RTL intuition, critical path trade-offs, and timing considerations..."
                        rows={3}
                        className="w-full rounded-lg border border-border bg-panel px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent resize-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] uppercase font-bold text-text-muted">
                          SystemVerilog / Verilog Code
                        </label>
                        <button
                          onClick={() => setNewSolutionCode(code)}
                          className="text-[10px] text-accent hover:underline"
                        >
                          Copy from Editor
                        </button>
                      </div>
                      <textarea
                        value={newSolutionCode}
                        onChange={(e) => setNewSolutionCode(e.target.value)}
                        rows={6}
                        className="w-full rounded-lg border border-border bg-panel p-2.5 font-mono text-xs text-text-primary outline-none focus:border-accent resize-y"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <input
                        type="text"
                        value={newSolutionTags}
                        onChange={(e) => setNewSolutionTags(e.target.value)}
                        placeholder="Tags (e.g. SystemVerilog, Area-Optimized)"
                        className="rounded-lg border border-border bg-panel px-2.5 py-1 text-[11px] text-text-secondary outline-none w-1/2"
                      />

                      <button
                        onClick={handlePostSolution}
                        disabled={postingSolution || !newSolutionTitle.trim() || !newSolutionCode.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-xs font-bold text-[#070707] transition-all hover:bg-accent-hover disabled:opacity-40"
                      >
                        <Send className="h-3 w-3" />
                        <span>{postingSolution ? "Publishing..." : "Publish Solution"}</span>
                      </button>
                    </div>

                    {postSolutionSuccess && (
                      <p className="text-xs text-success font-semibold text-center pt-1">
                        Solution published successfully!
                      </p>
                    )}
                  </div>
                )}

                {/* Editorial Sub-Tab */}
                {solutionTab === "editorial" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-surface/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-primary flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-accent" />
                          Official Reference Solution
                        </span>
                        {problem.referenceSolution && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(problem.referenceSolution || "");
                              }}
                              className="flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-[10px] font-medium text-text-muted hover:text-text-primary border border-border"
                              title="Copy Reference Solution"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Load reference solution into code editor?")) {
                                  setCode(problem.referenceSolution || "");
                                }
                              }}
                              className="flex items-center gap-1 rounded bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent hover:bg-accent/20 border border-accent/30"
                              title="Load into Editor"
                            >
                              <Code className="h-3 w-3" />
                              <span>Load into Editor</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {problem.referenceSolution ? (
                        <div className="rounded-lg border border-border bg-panel overflow-hidden">
                          <pre className="p-3 font-mono text-[11px] leading-relaxed text-text-primary overflow-x-auto whitespace-pre-wrap">
                            {problem.referenceSolution}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-xs text-text-dim py-6 text-center">
                          Reference solution will unlock after you submit an accepted RTL design!
                        </p>
                      )}
                    </div>

                    {/* Microarchitecture & Hardware Engineering Insights */}
                    <div className="rounded-xl border border-border bg-surface/30 p-4 space-y-2.5">
                      <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-accent" />
                        Hardware Microarchitecture & Synthesis Notes
                      </h4>
                      <div className="text-xs text-text-secondary leading-relaxed space-y-2">
                        <p>
                          <strong>Timing Closure:</strong> Minimizing logic levels in combinational paths prevents timing violations ($T_{'{'}clk{'}'} \ge T_{'{'}cq{'}'} + T_{'{'}comb{'}'} + T_{'{'}setup{'}'}$).
                        </p>
                        <p>
                          <strong>Area Optimization:</strong> For FPGA targets, bitwise reduction operators and priority casez structures synthesize directly to 4-input or 6-input Look-Up Tables (LUTs).
                        </p>
                        <p>
                          <strong>Glitches & Metastability:</strong> Sequential outputs must be registered at clock boundaries to eliminate combinational hazards before driving downstream logic.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Community Sub-Tab */}
                {solutionTab === "community" && (
                  <div className="space-y-3">
                    {solutionsLoading ? (
                      <div className="space-y-2 py-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-24 animate-pulse rounded-xl bg-surface" />
                        ))}
                      </div>
                    ) : solutions.length === 0 ? (
                      <div className="rounded-xl border border-border bg-surface p-8 text-center space-y-3">
                        <Sparkles className="mx-auto h-8 w-8 text-accent/60" />
                        <h4 className="text-sm font-bold text-text-primary">
                          No Community Solutions Yet
                        </h4>
                        <p className="text-xs text-text-muted max-w-sm mx-auto">
                          Be the first hardware engineer to share your verified RTL implementation with the community!
                        </p>
                        <button
                          onClick={() => {
                            setShowPostSolution(true);
                            if (!newSolutionCode) setNewSolutionCode(code || problem.starterCode || "");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-[#070707] hover:bg-accent-hover"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Share Solution
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {solutions.map((sol) => (
                          <div
                            key={sol.id}
                            className="rounded-xl border border-border bg-surface p-4 space-y-3 transition-colors hover:border-accent/40"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-bold text-text-primary">
                                  {sol.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-text-dim">
                                  <span className="font-semibold text-text-secondary">
                                    @{sol.username}
                                  </span>
                                  <span>·</span>
                                  <span>{new Date(sol.createdAt).toLocaleDateString()}</span>
                                  {sol.tags && sol.tags.length > 0 && (
                                    <>
                                      <span>·</span>
                                      <div className="flex items-center gap-1 flex-wrap">
                                        {sol.tags.map((t, idx) => (
                                          <span
                                            key={idx}
                                            className="rounded bg-panel px-1.5 py-0.2 font-mono text-[9px] text-accent border border-border"
                                          >
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleVoteSolution(sol.id, sol.upvotes)}
                                className="flex items-center gap-1 rounded-lg border border-border bg-panel px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-accent hover:border-accent/40 transition-colors shrink-0"
                                title="Upvote solution"
                              >
                                <ThumbsUp className="h-3 w-3" />
                                <span>{sol.upvotes}</span>
                              </button>
                            </div>

                            {sol.content && (
                              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                                {sol.content}
                              </p>
                            )}

                            {sol.code && (
                              <div className="relative rounded-lg border border-border bg-panel overflow-hidden">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-surface/60 border-b border-border text-[10px] font-mono text-text-dim">
                                  <span>SystemVerilog</span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => navigator.clipboard.writeText(sol.code)}
                                      className="hover:text-text-primary flex items-center gap-1"
                                      title="Copy Code"
                                    >
                                      <Copy className="h-2.5 w-2.5" />
                                      <span>Copy</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm("Replace current editor code with this solution?")) {
                                          setCode(sol.code);
                                        }
                                      }}
                                      className="text-accent hover:underline flex items-center gap-1 font-semibold"
                                      title="Load Code into Editor"
                                    >
                                      <Code className="h-2.5 w-2.5" />
                                      <span>Load</span>
                                    </button>
                                  </div>
                                </div>
                                <pre className="p-3 font-mono text-[11px] leading-relaxed text-text-primary overflow-x-auto whitespace-pre-wrap">
                                  {sol.code}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Discussion Tab */}
            {activeTab === "discussion" && (
              <div className="space-y-4">
                {user ? (
                  <div className="rounded-xl border border-border bg-surface p-3">
                    <textarea
                      value={newDiscussion}
                      onChange={(e) => setNewDiscussion(e.target.value)}
                      placeholder="Share your RTL hardware approach or ask a question..."
                      className="w-full bg-transparent text-xs text-text-primary placeholder-text-dim outline-none resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handlePostDiscussion}
                        disabled={postingDiscussion || !newDiscussion.trim()}
                        className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-accent px-3 text-[10px] font-semibold text-[#070707] transition-all hover:bg-accent-hover disabled:opacity-40"
                      >
                        <Send className="h-3 w-3" />
                        Post
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-surface p-3 text-center text-xs text-text-muted">
                    <Link href="/login" className="text-accent font-semibold hover:underline">
                      Log in
                    </Link>{" "}
                    to join the hardware discussion.
                  </div>
                )}

                {discussionsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-lg bg-surface" />
                    ))}
                  </div>
                ) : discussions.length > 0 ? (
                  <div className="space-y-3">
                    {discussions.map((d) => (
                      <div key={d.id} className="rounded-xl border border-border bg-surface p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => handleVote(d.id, 1)}
                              className="text-text-dim hover:text-accent transition-colors"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </button>
                            <span className="text-[10px] font-semibold text-text-secondary">
                              {d.upvotes}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-semibold text-text-primary">
                                @{d.username}
                              </span>
                              <span className="text-[10px] text-text-dim">
                                {new Date(d.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary whitespace-pre-wrap">
                              {d.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-dim text-center py-8">
                    No discussions yet. Be the first to start the conversation!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Code Studio & Interactive Console */}
        <div className="flex flex-1 flex-col overflow-hidden bg-editor">
          {/* Editor Header Tab Bar */}
          <div className="flex items-center justify-between border-b border-border bg-surface/70 px-4 py-1.5">
            <div className="flex items-center gap-2">
              <select className="rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-mono font-medium border border-border text-text-primary outline-none hover:border-text-dim transition-colors">
                <option value="systemverilog">SystemVerilog (IEEE 1800-2012)</option>
                <option value="verilog">Verilog (IEEE 1364-2001)</option>
              </select>

              <div className="flex items-center gap-1 border-l border-border pl-2">
                <button
                  onClick={() => setActiveEditorTab("design")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    activeEditorTab === "design"
                      ? "bg-surface text-text-primary font-bold border border-border shadow-sm"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <Code className="h-3.5 w-3.5 text-accent" />
                  <span>design.sv</span>
                </button>

                <button
                  onClick={() => setActiveEditorTab("testbench")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    activeEditorTab === "testbench"
                      ? "bg-surface text-text-primary font-bold border border-border shadow-sm"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5 text-accent" />
                  <span>testbench.sv</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 text-text-muted">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeEditorTab === "design" ? code : testbenchCode);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-surface hover:text-text-primary transition-colors"
                title="Copy code to clipboard"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleResetCode}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-surface hover:text-text-primary transition-colors"
                title="Reset code to initial template"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[260px] overflow-hidden">
            {activeEditorTab === "design" ? (
              <CodeEditor value={code} onChange={setCode} />
            ) : (
              <CodeEditor value={testbenchCode} onChange={setTestbenchCode} />
            )}
          </div>

          {/* XP & Achievement Earned Banner Toast */}
          {xpNotification && (
            <div className="mx-4 mt-2 rounded-xl border border-accent/30 bg-accent/10 p-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-accent">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-accent">
                      +{xpNotification.xpEarned} XP Earned!
                    </p>
                    <p className="text-[11px] text-text-secondary">
                      Level {xpNotification.level} · {xpNotification.xpTotal.toLocaleString()} total XP
                    </p>
                  </div>
                </div>
                {xpNotification.achievements.length > 0 && (
                  <div className="flex items-center gap-2">
                    {xpNotification.achievements.map((ach) => (
                      <div
                        key={ach.slug}
                        className="flex items-center gap-1.5 rounded-lg bg-accent/20 px-2.5 py-1"
                      >
                        <span className="text-base">{ach.icon}</span>
                        <span className="text-xs font-bold text-accent">{ach.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Console / Test Results Inspector */}
          <div className="p-3 border-t border-border bg-panel/70">
            <Console
              result={result}
              isRunning={isRunning}
              hasWaveform={!!(result?.waveformId || waveformData)}
              onOpenWaveform={() => {
                if (result?.waveformId && !waveformData) {
                  loadWaveform(result.waveformId);
                } else {
                  setShowWaveform(true);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Waveform Drawer / Overlay */}
      {showWaveform && waveformData && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[50vh] border-t-2 border-accent/40 bg-panel shadow-2xl overflow-y-auto">
          <WaveformViewer
            data={waveformData}
            onClose={() => setShowWaveform(false)}
          />
        </div>
      )}

      {/* AI Assistant Floating Tutor */}
      <AIAssistant
        problemSlug={problem.slug}
        code={code}
        compilerError={result?.compilationMessage}
        waveformId={result?.waveformId}
        submissionStatus={result?.status}
        testsPassed={result?.testsPassed}
        testsTotal={result?.testsTotal}
      />
    </div>
  );
}
