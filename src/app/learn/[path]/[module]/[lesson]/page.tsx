"use client";

import { useCallback, useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  fetchLesson,
  startLesson,
  completeLesson,
  fetchQuiz,
  submitQuiz,
} from "@/lib/api";
import { LessonDetail, QuizDetail, QuizResult } from "@/lib/types";
import AIAssistant from "@/components/AIAssistant";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  BookOpen,
  HelpCircle,
} from "lucide-react";

const difficultyColor: Record<string, string> = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-error",
};

export default function LessonPage({
  params,
}: {
  params: Promise<{ path: string; module: string; lesson: string }>;
}) {
  const { path: pathSlug, module: moduleSlug, lesson: lessonSlug } = use(params);
  const { user } = useAuth();

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const [showQuiz, setShowQuiz] = useState(false);
  const [completing, setCompleting] = useState(false);

  const loadLesson = useCallback(async () => {
    try {
      const data = await fetchLesson(lessonSlug);
      setLesson(data);
      if (user && data.status === "NOT_STARTED" && data.prerequisitesMet) {
        await startLesson(lessonSlug);
        setLesson({ ...data, status: "IN_PROGRESS" });
      }
    } catch {
      setError("Lesson not found");
    } finally {
      setLoading(false);
    }
  }, [lessonSlug, user]);

  useEffect(() => { void loadLesson(); }, [loadLesson]);

  const loadQuiz = useCallback(async () => {
    if (!lesson) return;
    setQuizLoading(true);
    try {
      const data = await fetchQuiz(lessonSlug);
      setQuiz(data);
      setQuizAnswers(new Array(data.questions.length).fill(""));
      setShowQuiz(true);
    } catch {
      // No quiz available
    } finally {
      setQuizLoading(false);
    }
  }, [lesson, lessonSlug]);

  const handleSubmitQuiz = useCallback(async () => {
    if (!quiz) return;
    setSubmittingQuiz(true);
    try {
      const result = await submitQuiz(quiz.id, quizAnswers);
      setQuizResult({
        score: result.score,
        passed: result.passed,
        results: result.results.map((r) => ({
          question: r.question,
          correct: r.correct,
          correctAnswer: r.correct_answer,
          explanation: r.explanation,
        })),
        xpEarned: result.xp_earned,
      });
    } catch {
      // Handle error
    } finally {
      setSubmittingQuiz(false);
    }
  }, [quiz, quizAnswers]);

  const handleComplete = useCallback(async () => {
    setCompleting(true);
    try {
      await completeLesson(lessonSlug);
      setLesson((prev) => prev ? { ...prev, status: "COMPLETED" } : null);
    } catch {
      // Handle error
    } finally {
      setCompleting(false);
    }
  }, [lessonSlug]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-4">
        <h1 className="text-lg font-bold text-text-primary">{error || "Lesson not found"}</h1>
        <Link
          href="/learn"
          className="inline-flex h-8 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-semibold text-[#070707] transition-all hover:bg-accent-hover"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Learn
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-[10px] text-text-dim">
        <Link href="/learn" className="hover:text-text-secondary transition-colors">Learn</Link>
        <span>/</span>
        {lesson.path && (
          <>
            <Link href={`/learn/${lesson.path.slug}`} className="hover:text-text-secondary transition-colors">{lesson.path.title}</Link>
            <span>/</span>
          </>
        )}
        {lesson.module && (
          <>
            <span className="text-text-muted">{lesson.module.title}</span>
            <span>/</span>
          </>
        )}
        <span className="text-text-primary">{lesson.title}</span>
      </nav>

      {/* Prerequisites warning */}
      {!lesson.prerequisitesMet && (
        <div className="mb-6 rounded-xl border border-warning/20 bg-warning/5 p-4">
          <p className="text-xs text-warning">Complete prerequisites first to unlock this lesson.</p>
          {lesson.prerequisites.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {lesson.prerequisites.map((p) => (
                <Link
                  key={p.slug}
                  href={`/learn/${pathSlug}/${moduleSlug}/${p.slug}`}
                  className="rounded-lg bg-warning/10 px-2.5 py-1 text-[10px] font-semibold text-warning hover:bg-warning/20 transition-colors"
                >
                  {p.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[10px] font-semibold capitalize ${difficultyColor[lesson.difficulty] || ""}`}>
            {lesson.difficulty}
          </span>
          <span className="text-[10px] text-text-dim flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {lesson.estimatedMinutes} min
          </span>
          {lesson.status === "COMPLETED" && (
            <span className="flex items-center gap-1 rounded-lg bg-accent/10 px-2 py-0.5 text-[9px] font-semibold text-accent">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-2">{lesson.title}</h1>
        <p className="text-sm text-text-muted">{lesson.description}</p>
      </div>

      {/* Content */}
      <div className="mb-10">
        <div className="rounded-xl border border-border bg-panel p-6">
          <div
            className="lesson-content text-sm leading-relaxed text-text-secondary whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.content) }}
          />
        </div>
      </div>

      {/* Related Problems */}
      {lesson.relatedProblems.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-dim">Practice This Concept</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {lesson.relatedProblems.map((problem) => (
              <Link
                key={problem.slug}
                href={`/problems/${problem.slug}`}
                className="flex items-center justify-between rounded-xl border border-border bg-panel px-4 py-3 transition-all hover:border-accent/20 hover:shadow-[0_0_12px_rgba(0,217,165,0.05)]"
              >
                <div>
                  <p className="text-xs font-medium text-text-primary">{problem.title}</p>
                  <p className="text-[10px] text-text-dim">{problem.category}</p>
                </div>
                <span className={`text-[10px] font-semibold capitalize ${difficultyColor[problem.difficulty] || ""}`}>
                  {problem.difficulty}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quiz */}
      {lesson.hasQuiz && !showQuiz && (
        <div className="mb-8">
          <button
            onClick={() => void loadQuiz()}
            disabled={quizLoading}
            className="inline-flex h-8 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-xs font-medium text-text-secondary transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-text-primary disabled:opacity-50"
          >
            {quizLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <HelpCircle className="h-3.5 w-3.5" />
            )}
            Take Quiz
          </button>
        </div>
      )}

      {showQuiz && quiz && (
        <div className="mb-8 rounded-xl border border-border bg-panel p-6">
          <h2 className="mb-4 text-base font-bold text-text-primary">{quiz.title}</h2>

          {!quizResult ? (
            <div className="space-y-5">
              {quiz.questions.map((q, idx) => {
                let options: string[] = [];
                try { options = JSON.parse(q.options); } catch { options = []; }
                return (
                  <div key={q.id} className="rounded-xl border border-border p-4">
                    <p className="text-xs font-medium text-text-primary mb-3">
                      {idx + 1}. {q.question}
                    </p>
                    <div className="space-y-1.5">
                      {options.map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-all text-xs ${
                            quizAnswers[idx] === opt
                              ? "border-accent bg-accent/10 text-text-primary"
                              : "border-border text-text-muted hover:border-border hover:bg-surface/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${idx}`}
                            value={opt}
                            checked={quizAnswers[idx] === opt}
                            onChange={() => {
                              const newAnswers = [...quizAnswers];
                              newAnswers[idx] = opt;
                              setQuizAnswers(newAnswers);
                            }}
                            className="sr-only"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => void handleSubmitQuiz()}
                disabled={submittingQuiz || quizAnswers.some((a) => !a)}
                className="inline-flex h-8 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-semibold text-[#070707] transition-all hover:bg-accent-hover hover:shadow-[0_0_16px_rgba(0,217,165,0.3)] disabled:opacity-50"
              >
                {submittingQuiz && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit Quiz
              </button>
            </div>
          ) : (
            <div>
              <div className={`mb-4 rounded-xl p-4 ${quizResult.passed ? "bg-accent/10 border border-accent/20" : "bg-error/10 border border-error/20"}`}>
                <p className={`text-base font-bold ${quizResult.passed ? "text-accent" : "text-error"}`}>
                  {quizResult.passed ? "Passed!" : "Not Passed"} — {quizResult.score}%
                </p>
                {quizResult.xpEarned > 0 && (
                  <p className="mt-1 text-xs text-accent">+{quizResult.xpEarned} XP earned</p>
                )}
              </div>

              <div className="space-y-3">
                {quizResult.results.map((r, idx) => (
                  <div key={idx} className={`rounded-xl border p-4 ${r.correct ? "border-accent/20 bg-accent/5" : "border-error/20 bg-error/5"}`}>
                    <p className="text-xs font-medium text-text-primary mb-2">{r.question}</p>
                    <p className={`text-[11px] ${r.correct ? "text-accent" : "text-error"}`}>
                      {r.correct ? "✓ Correct" : `✗ Your answer: —`}
                    </p>
                    {!r.correct && (
                      <p className="mt-1 text-[11px] text-text-muted">Correct: {r.correctAnswer}</p>
                    )}
                    <p className="mt-1 text-[10px] text-text-dim">{r.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-6 mt-8">
        {lesson.prevLesson ? (
          <Link
            href={`/learn/${pathSlug}/${moduleSlug}/${lesson.prevLesson.slug}`}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {lesson.prevLesson.title}
          </Link>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {lesson.status !== "COMPLETED" && lesson.prerequisitesMet && (
            <button
              onClick={() => void handleComplete()}
              disabled={completing}
              className="inline-flex h-8 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-semibold text-[#070707] transition-all hover:bg-accent-hover hover:shadow-[0_0_16px_rgba(0,217,165,0.3)] disabled:opacity-50"
            >
              {completing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Mark Complete
            </button>
          )}

          {lesson.nextLesson ? (
            <Link
              href={`/learn/${pathSlug}/${moduleSlug}/${lesson.nextLesson.slug}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-xs font-medium text-text-secondary transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-text-primary"
            >
              Next: {lesson.nextLesson.title}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href="/learn"
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-xs font-medium text-text-secondary transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-text-primary"
            >
              Back to Learn
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant lessonSlug={lessonSlug} code={lesson.content} />
    </div>
  );
}

function renderMarkdown(content: string): string {
  return content
    .replace(/```systemverilog\n([\s\S]*?)```/g, '<pre class="rounded-xl bg-[#070707] p-4 text-xs text-accent overflow-x-auto my-4 border border-border"><code>$1</code></pre>')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="rounded-xl bg-[#070707] p-4 text-xs text-text-secondary overflow-x-auto my-4 border border-border"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="rounded-lg bg-surface px-1.5 py-0.5 text-xs text-accent">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-text-primary mt-6 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-text-primary mt-8 mb-4">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) return '';
      return '<tr>' + cells.map((c) => `<td class="border border-border px-3 py-2 text-xs">${c}</td>`).join('') + '</tr>';
    })
    .replace(/(<tr>[\s\S]*?<\/tr>)/g, '<table class="border-collapse border border-border my-4 w-full">$1</table>')
    .replace(/^- (.+)$/gm, '<li class="text-xs text-text-secondary ml-4 mb-1">• $1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="text-xs text-text-secondary ml-4 mb-1">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
