"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { use } from "react";
import Link from "next/link";
import { fetchProblemBySlug, fetchWaveform, fetchProblemSubmissions, fetchDiscussions, createDiscussion, voteDiscussion } from "@/lib/api";
import { Problem, SubmissionResult, WaveformData, AchievementInfo, ProblemSubmission, Discussion } from "@/lib/types";
import { runCode, submitCode } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import CodeEditor from "@/components/CodeEditor";
import Console from "@/components/Console";
import DifficultyBadge from "@/components/DifficultyBadge";
import CategoryBadge from "@/components/CategoryBadge";
import { WaveformViewer } from "@/components/waveform";
import {
  Play,
  Send,
  FileText,
  Lock,
  ChevronDown,
  ChevronRight,
  Zap,
  Trophy,
  ArrowLeft,
  BookOpen,
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  XCircle,
  History,
  Loader2,
} from "lucide-react";

type LeftTab = "description" | "submissions" | "solution" | "discussion";
type EditorFile = "design" | "testbench";

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-error",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

export default function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [testbenchCode, setTestbenchCode] = useState("");
  const [activeFile, setActiveFile] = useState<EditorFile>("design");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<LeftTab>("description");

  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [waveformLoading, setWaveformLoading] = useState(false);
  const [waveformError, setWaveformError] = useState<string | null>(null);
  const [showWaveform, setShowWaveform] = useState(false);
  const waveformLoadedRef = useRef<string | null>(null);

  const [xpNotification, setXpNotification] = useState<{
    xpEarned: number;
    xpTotal: number;
    level: number;
    achievements: AchievementInfo[];
  } | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [submissions, setSubmissions] = useState<ProblemSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState<number | null>(null);

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState("");
  const [postingDiscussion, setPostingDiscussion] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const p = await fetchProblemBySlug(slug);
        if (!cancelled) {
          setProblem(p);
          setCode(p.starterCode);
          setTestbenchCode(p.publicTestbenches?.[0]?.testbench || "");
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load problem. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "discussion" || tab === "submissions" || tab === "solution") {
      setActiveTab(tab);
    }
  }, []);

  const loadWaveform = useCallback(async (waveformId: string) => {
    setWaveformLoading(true);
    setWaveformError(null);
    try {
      const data = await fetchWaveform(waveformId);
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
      setWaveformLoading(true);
      setWaveformError(null);
      fetchWaveform(result.waveformId)
        .then((data) => { setWaveformData(data); setShowWaveform(true); })
        .catch((err) => { setWaveformError(err instanceof Error ? err.message : "Failed to load waveform"); })
        .finally(() => { setWaveformLoading(false); });
    }
  }, [result, waveformLoading, waveformData]);

  const loadSubmissions = useCallback(async () => {
    if (!problem) return;
    setSubmissionsLoading(true);
    try {
      const data = await fetchProblemSubmissions(problem.slug);
      setSubmissions(data);
    } catch {
      // Handle error
    } finally {
      setSubmissionsLoading(false);
    }
  }, [problem]);

  const loadDiscussions = useCallback(async () => {
    if (!problem) return;
    setDiscussionsLoading(true);
    try {
      const data = await fetchDiscussions(problem.slug);
      setDiscussions(data);
    } catch {
      // Handle error
    } finally {
      setDiscussionsLoading(false);
    }
  }, [problem]);

  useEffect(() => {
    if (activeTab === "submissions") void loadSubmissions();
    if (activeTab === "discussion") void loadDiscussions();
  }, [activeTab, loadSubmissions, loadDiscussions]);

  const resetRunState = () => {
    setResult(null);
    setWaveformData(null);
    setShowWaveform(false);
    setWaveformError(null);
    setXpNotification(null);
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
  };

  const handleRun = async () => {
    if (!problem) return;
    setIsRunning(true);
    resetRunState();
    try {
      const res = await runCode({ problemSlug: problem.slug, language: problem.language, code, testbenchCode });
      setResult(res);
    } catch {
      setResult({
        status: "error", compilationMessage: "Unable to connect to the HDLForge server.",
        tests: [], score: 0, testsPassed: 0, testsTotal: 0, executionTime: 0,
        xpEarned: 0, xpTotal: 0, level: 1, progressStatus: null, achievementsUnlocked: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem) return;
    setIsRunning(true);
    resetRunState();
    try {
      const res = await submitCode({ problemSlug: problem.slug, language: problem.language, code, testbenchCode });
      setResult(res);
      if (res.xpEarned > 0 || res.achievementsUnlocked.length > 0) {
        setXpNotification({
          xpEarned: res.xpEarned, xpTotal: res.xpTotal, level: res.level,
          achievements: res.achievementsUnlocked,
        });
        notificationTimeoutRef.current = setTimeout(() => setXpNotification(null), 5000);
      }
    } catch {
      setResult({
        status: "error", compilationMessage: "Unable to connect to the HDLForge server.",
        tests: [], score: 0, testsPassed: 0, testsTotal: 0, executionTime: 0,
        xpEarned: 0, xpTotal: 0, level: 1, progressStatus: null, achievementsUnlocked: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handlePostDiscussion = async () => {
    if (!problem || !newDiscussion.trim()) return;
    setPostingDiscussion(true);
    try {
      await createDiscussion(problem.slug, newDiscussion.trim());
      setNewDiscussion("");
      await loadDiscussions();
    } catch {
      // Handle error
    } finally {
      setPostingDiscussion(false);
    }
  };

  const handleVote = async (discussionId: number, vote: number) => {
    try {
      await voteDiscussion(discussionId, vote);
      await loadDiscussions();
    } catch {
      // Handle error
    }
  };

  const isSolved = result?.status === "PASSED" || result?.progressStatus === "SOLVED";

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-3rem)] flex-col items-center justify-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-xs text-text-muted">Loading problem...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="flex h-[calc(100dvh-3rem)] flex-col items-center justify-center gap-4">
        <h1 className="text-lg font-bold text-text-primary">{error || "Problem not found"}</h1>
        <p className="text-xs text-text-muted">The problem you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/problems"
          className="inline-flex h-8 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-semibold text-on-accent transition-all hover:bg-accent-hover"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to Problems
        </Link>
      </div>
    );
  }

  const leftTabs: { key: LeftTab; label: string; icon: typeof FileText }[] = [
    { key: "description", label: "Description", icon: FileText },
    { key: "submissions", label: "Submissions", icon: History },
    { key: "solution", label: "Solutions", icon: BookOpen },
    { key: "discussion", label: "Discussion", icon: MessageSquare },
  ];

  const fileTabs: { key: EditorFile; filename: string }[] = [
    { key: "design", filename: "design.sv" },
    { key: "testbench", filename: "testbench.sv" },
  ];

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col bg-background">
      {/* Header bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border bg-panel px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/problems"
            title="All problems"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-base font-semibold text-text-primary">
              {problem.title}
            </h1>
            {problem.locked && <Lock className="h-3.5 w-3.5 shrink-0 text-text-dim" />}
            <span className={`shrink-0 text-sm font-semibold ${DIFFICULTY_COLOR[problem.difficulty]}`}>
              {DIFFICULTY_LABEL[problem.difficulty]}
            </span>
            <span className="hidden shrink-0 rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-text-secondary sm:inline">
              {problem.language === "systemverilog" ? "SystemVerilog" : "Verilog"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {problem.timeComplexity && (
            <span className="hidden rounded-lg border border-border bg-surface px-2.5 py-1 font-mono text-xs text-text-secondary sm:inline">
              Time: <span className="text-accent">{problem.timeComplexity}</span>
            </span>
          )}
          {problem.spaceComplexity && (
            <span className="hidden rounded-lg border border-border bg-surface px-2.5 py-1 font-mono text-xs text-text-secondary sm:inline">
              Space: <span className="text-accent">{problem.spaceComplexity}</span>
            </span>
          )}
          <div className="hidden h-5 w-px bg-border sm:block" />
          <button
            onClick={handleRun}
            disabled={isRunning || problem.locked}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run
          </button>
          <button
            onClick={handleSubmit}
            disabled={isRunning || problem.locked}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-secondary transition-all hover:border-accent/40 hover:bg-accent/5 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            Submit
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left panel */}
        <div className="flex h-[45vh] w-full shrink-0 flex-col border-b border-border lg:h-auto lg:w-[44%] lg:min-w-[340px] lg:max-w-[620px] lg:border-b-0 lg:border-r">
          <div className="flex shrink-0 items-center gap-1 border-b border-border px-3">
            {leftTabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex h-10 items-center gap-1.5 border-b-2 px-3 text-[13px] font-medium transition-colors ${
                  activeTab === key
                    ? "border-accent text-text-primary"
                    : "border-transparent text-text-muted hover:bg-surface/60 hover:text-text-secondary"
                }`}
                style={{ marginBottom: -1 }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {/* Description */}
            {activeTab === "description" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-semibold text-text-primary">{problem.title}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-semibold ${DIFFICULTY_COLOR[problem.difficulty]}`}>
                      {DIFFICULTY_LABEL[problem.difficulty]}
                    </span>
                    <CategoryBadge category={problem.category} size="md" />
                    <span className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-text-secondary">
                      {problem.language === "systemverilog" ? "SystemVerilog" : "Verilog"}
                    </span>
                  </div>
                  <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">
                    {problem.description}
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-text-dim">Input</h3>
                  <p className="rounded-lg bg-surface p-3.5 font-mono text-sm text-text-secondary">{problem.inputDescription}</p>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-text-dim">Output</h3>
                  <p className="rounded-lg bg-surface p-3.5 font-mono text-sm text-text-secondary">{problem.outputDescription}</p>
                </div>

                {problem.examples.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-text-dim">Examples</h3>
                    <div className="space-y-2">
                      {problem.examples.map((ex, i) => (
                        <div key={i} className="rounded-xl border border-border bg-surface p-4">
                          <div className="mb-2 text-sm font-semibold text-text-primary">{ex.title}</div>
                          <div className="space-y-1.5 font-mono text-sm">
                            <div>
                              <span className="text-text-dim">Input: </span>
                              <span className="text-text-primary">{ex.input}</span>
                            </div>
                            <div>
                              <span className="text-text-dim">Output: </span>
                              <span className="text-success">{ex.output}</span>
                            </div>
                            {ex.explanation && (
                              <div>
                                <span className="text-text-dim">Explanation: </span>
                                <span className="text-text-secondary">{ex.explanation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {problem.constraints.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-text-dim">Constraints</h3>
                    <ul className="space-y-1">
                      {problem.constraints.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/40" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Submissions */}
            {activeTab === "submissions" && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-text-primary">Your Submissions</h3>
                {submissionsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-12 animate-pulse rounded-xl bg-surface" />
                    ))}
                  </div>
                ) : submissions.length > 0 ? (
                  submissions.map((sub) => (
                    <div key={sub.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                      <button
                        onClick={() => setExpandedSubmission(expandedSubmission === sub.id ? null : sub.id)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <div className="flex items-center gap-3">
                          {sub.status === "PASSED" ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-error" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold ${
                                sub.status === "PASSED" ? "text-success" : "text-error"
                              }`}>
                                {sub.score}%
                              </span>
                              <span className="text-xs text-text-dim">
                                {sub.testsPassed}/{sub.testsTotal} tests
                              </span>
                            </div>
                            <span className="text-xs text-text-dim">
                              {new Date(sub.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-dim">{(sub.executionTime * 1000).toFixed(0)}ms</span>
                          {expandedSubmission === sub.id ? (
                            <ChevronDown className="h-3.5 w-3.5 text-text-dim" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-text-dim" />
                          )}
                        </div>
                      </button>
                      {expandedSubmission === sub.id && (
                        <div className="border-t border-border px-4 py-3">
                          <pre className="max-h-48 overflow-auto rounded-lg bg-editor p-3 font-mono text-[11px] leading-relaxed text-text-secondary">
                            {sub.code}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-dim">No submissions yet.</p>
                )}
              </div>
            )}

            {/* Solutions */}
            {activeTab === "solution" && (
              <div className="space-y-4">
                {isSolved || showSolution ? (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <h3 className="text-xs font-bold text-text-primary">Reference Solution</h3>
                    </div>
                    {problem.referenceSolution ? (
                      <pre className="overflow-x-auto rounded-xl border border-border bg-surface p-4 font-mono text-[11px] leading-relaxed text-text-secondary">
                        {problem.referenceSolution}
                      </pre>
                    ) : (
                      <p className="text-xs text-text-dim">No reference solution available.</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Lock className="mb-3 h-8 w-8 text-text-dim" />
                    <p className="text-xs text-text-muted">Solution available after solving.</p>
                    <button
                      onClick={() => setShowSolution(true)}
                      className="mt-3 text-xs text-accent hover:underline"
                    >
                      Show anyway
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Discussion */}
            {activeTab === "discussion" && (
              <div className="space-y-4">
                {user && (
                  <div className="rounded-xl border border-border bg-surface p-3">
                    <textarea
                      value={newDiscussion}
                      onChange={(e) => setNewDiscussion(e.target.value)}
                      placeholder="Share your approach or ask a question..."
                      className="w-full resize-none bg-transparent text-xs text-text-primary placeholder-text-dim outline-none"
                      rows={3}
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handlePostDiscussion}
                        disabled={postingDiscussion || !newDiscussion.trim()}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-on-accent transition-all hover:bg-accent-hover disabled:opacity-40"
                      >
                        {postingDiscussion ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Post
                      </button>
                    </div>
                  </div>
                )}

                {discussionsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-20 animate-pulse rounded-xl bg-surface" />
                    ))}
                  </div>
                ) : discussions.length > 0 ? (
                  discussions.map((d) => (
                    <div key={d.id} className="rounded-xl border border-border bg-surface p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleVote(d.id, 1)}
                            className="text-text-dim hover:text-accent transition-colors"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs font-semibold text-text-secondary">{d.upvotes}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-text-primary">@{d.username}</span>
                            {d.isSolution && (
                              <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">SOLUTION</span>
                            )}
                            <span className="text-xs text-text-dim">{new Date(d.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-xs text-text-secondary">{d.content}</p>
                          {d.replies.length > 0 && (
                            <div className="mt-3 space-y-2 border-l-2 border-border pl-3">
                              {d.replies.map((r) => (
                                <div key={r.id}>
                                  <div className="mb-1 flex items-center gap-2">
                                    <span className="text-[10px] font-semibold text-text-primary">@{r.username}</span>
                                    <span className="text-xs text-text-dim">{new Date(r.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="whitespace-pre-wrap text-[11px] text-text-secondary">{r.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-xs text-text-dim">No discussions yet. Be the first to share!</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Editor tab bar */}
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-surface/40 px-3">
            <div className="flex items-center gap-0.5">
              {fileTabs.map(({ key, filename }) => {
                const Icon = key === "design" ? FileText : Send;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveFile(key)}
                    className={`flex h-full items-center gap-1.5 border-b-2 px-3 font-mono text-[13px] transition-colors ${
                      activeFile === key
                        ? "border-accent text-text-primary"
                        : "border-transparent text-text-muted hover:bg-surface/60 hover:text-text-secondary"
                    }`}
                    style={{ marginBottom: -1 }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {filename}
                  </button>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {result?.waveformId && result.status !== "error" && !showWaveform && (
                <button
                  onClick={() => result.waveformId && loadWaveform(result.waveformId)}
                  disabled={waveformLoading}
                  className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-[10px] font-medium text-text-secondary transition-all hover:border-accent/40 hover:text-text-primary disabled:opacity-50"
                >
                  {waveformLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin text-accent" />
                  ) : (
                    <Zap className="h-3 w-3 text-accent" />
                  )}
                  Waveform
                </button>
              )}
              {result && result.status !== "error" && (
                <span className="font-mono text-xs text-text-secondary">
                  <span className={result.testsPassed === result.testsTotal ? "text-success" : "text-warning"}>
                    {result.testsPassed}/{result.testsTotal}
                  </span>{" "}
                  {result.executionTime > 0 && (
                    <span className="text-text-dim">· {(result.executionTime * 1000).toFixed(0)}ms</span>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 bg-editor">
            <CodeEditor
              value={activeFile === "design" ? code : testbenchCode}
              onChange={(v) => activeFile === "design" ? setCode(v) : setTestbenchCode(v)}
            />
          </div>

          {/* Console */}
          <div className="shrink-0 border-t border-border bg-panel">
            <div className="max-h-56 overflow-y-auto p-4">
              {xpNotification && (
                <div className="mb-3 rounded-xl border border-accent/20 bg-accent/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                        <Trophy className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-accent">+{xpNotification.xpEarned} XP Earned!</p>
                        <p className="text-[11px] text-text-muted">
                          Level {xpNotification.level} · {xpNotification.xpTotal.toLocaleString()} XP total
                        </p>
                      </div>
                    </div>
                    {xpNotification.achievements.length > 0 && (
                      <div className="flex items-center gap-2">
                        {xpNotification.achievements.map((ach) => (
                          <div key={ach.slug} className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-2 py-1">
                            <span className="text-sm">{ach.icon}</span>
                            <span className="text-[10px] font-semibold text-accent">{ach.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <Console result={result} isRunning={isRunning} />
              {waveformError && (
                <div className="mt-2 text-xs text-warning">Waveform: {waveformError}</div>
              )}
            </div>
          </div>

          {/* Waveform */}
          {showWaveform && waveformData && (
            <div className="shrink-0 border-t border-border bg-panel p-3">
              <WaveformViewer
                data={waveformData}
                onClose={() => { setShowWaveform(false); setWaveformData(null); }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}