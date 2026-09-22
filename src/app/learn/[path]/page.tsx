"use client";

import { useCallback, useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { fetchLearningPath } from "@/lib/api";
import { LearningPathDetail } from "@/lib/types";
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Clock } from "lucide-react";

const difficultyColor: Record<string, string> = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-error",
};

const statusConfig: Record<string, { icon: typeof Circle; color: string }> = {
  NOT_STARTED: { icon: Circle, color: "text-text-dim" },
  IN_PROGRESS: { icon: Clock, color: "text-warning" },
  COMPLETED: { icon: CheckCircle2, color: "text-accent" },
};

export default function PathPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path: pathSlug } = use(params);
  const [path, setPath] = useState<LearningPathDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPath = useCallback(async () => {
    try {
      const data = await fetchLearningPath(pathSlug);
      setPath(data);
    } catch {
      setError("Path not found");
    } finally {
      setLoading(false);
    }
  }, [pathSlug]);

  useEffect(() => { void loadPath(); }, [loadPath]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-4">
        <h1 className="text-lg font-bold text-text-primary">{error || "Path not found"}</h1>
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
      <div className="mb-8">
        <Link href="/learn" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary mb-4 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Learn
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
            <BookOpen className="h-5 w-5 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">{path.title}</h1>
        </div>
        <p className="text-sm text-text-muted">{path.description}</p>
        <div className="mt-3 flex items-center gap-3">
          <span className={`text-[10px] font-semibold capitalize ${difficultyColor[path.difficulty] || ""}`}>
            {path.difficulty}
          </span>
          <span className="text-[10px] text-text-dim">{path.estimatedHours} hours</span>
          <span className="text-[10px] text-text-dim">{path.modules.length} modules</span>
        </div>
      </div>

      <div className="space-y-4">
        {path.modules.map((module, moduleIndex) => (
          <div key={module.slug} className="rounded-xl border border-border bg-panel overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
                  {moduleIndex + 1}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-text-primary">{module.title}</h2>
                  <p className="text-[10px] text-text-dim">{module.description}</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {module.lessons.map((lesson) => {
                const st = statusConfig[lesson.status ?? "NOT_STARTED"] || statusConfig.NOT_STARTED;
                const StatusIcon = st.icon;
                return (
                  <Link
                    key={lesson.slug}
                    href={`/learn/${path.slug}/${module.slug}/${lesson.slug}`}
                    className="flex items-center justify-between px-5 py-3 transition-all hover:bg-surface/50"
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-4 w-4 ${st.color}`} />
                      <div>
                        <p className="text-xs font-medium text-text-primary">{lesson.title}</p>
                        <p className="text-[10px] text-text-dim">{lesson.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lesson.hasQuiz && (
                        <span className="rounded-lg bg-info/10 px-2 py-0.5 text-[9px] font-semibold text-info">
                          Quiz
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold capitalize ${difficultyColor[lesson.difficulty] || ""}`}>
                        {lesson.difficulty}
                      </span>
                      <span className="text-[10px] text-text-dim">{lesson.estimatedMinutes}m</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
