"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  fetchLearningPaths,
  fetchLearningProgress,
  fetchLearningRecommendations,
  fetchConceptMastery,
} from "@/lib/api";
import {
  LearningPathSummary,
  LearningProgressData,
  LearningRecommendations,
  ConceptMastery,
} from "@/lib/types";
import { BookOpen, ArrowRight, ChevronRight, Sparkles } from "lucide-react";

const difficultyColor: Record<string, string> = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-error",
};

export default function LearnPage() {
  const { user } = useAuth();
  const [paths, setPaths] = useState<LearningPathSummary[]>([]);
  const [progress, setProgress] = useState<LearningProgressData | null>(null);
  const [recommendations, setRecommendations] = useState<LearningRecommendations | null>(null);
  const [mastery, setMastery] = useState<ConceptMastery[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [pathsData, progressData, recsData, masteryData] = await Promise.all([
        fetchLearningPaths(),
        user ? fetchLearningProgress() : Promise.resolve(null),
        user ? fetchLearningRecommendations() : Promise.resolve(null),
        user ? fetchConceptMastery() : Promise.resolve(null),
      ]);
      setPaths(pathsData.paths);
      setProgress(progressData);
      setRecommendations(recsData);
      setMastery(masteryData?.concepts || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadData(); }, [loadData]);

  const topMastery = mastery
    .filter((c) => c.masteryScore > 0)
    .sort((a, b) => b.masteryScore - a.masteryScore)
    .slice(0, 6);

  const weakConcepts = mastery
    .filter((c) => c.masteryScore > 0 && c.masteryScore < 30)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
            <BookOpen className="h-5 w-5 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Learn RTL Design</h1>
        </div>
        <p className="text-sm text-text-muted">Structured curriculum from digital logic to advanced RTL</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-panel" />
          ))}
        </div>
      ) : (
        <>
          {progress && progress.paths.length > 0 && progress.completedLessons > 0 && (
            <div className="mb-8 rounded-xl border border-border bg-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-text-muted">Overall Progress</p>
                  <p className="text-2xl font-bold text-accent">
                    {progress.completedLessons} / {progress.totalLessons} lessons
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Curriculum</p>
                  <p className="text-2xl font-bold text-text-primary">{progress.progressPercent.toFixed(0)}%</p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {recommendations?.nextLesson && (
            <div className="mb-8 rounded-xl border border-accent/20 bg-accent/5 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <p className="text-xs font-semibold text-accent">Continue Learning</p>
                  </div>
                  <h3 className="text-base font-bold text-text-primary">{recommendations.nextLesson.title}</h3>
                  <p className="mt-1 text-xs text-text-muted">
                    {recommendations.nextLesson.moduleTitle} · {recommendations.nextLesson.pathTitle}
                  </p>
                  <p className="mt-2 text-[10px] text-text-dim">{recommendations.reason}</p>
                </div>
                <Link
                  href={`/learn/${recommendations.nextLesson.pathSlug}/${recommendations.nextLesson.moduleSlug}/${recommendations.nextLesson.slug}`}
                  className="flex h-8 items-center gap-1.5 rounded-xl bg-accent px-4 text-xs font-semibold text-on-accent transition-all hover:bg-accent-hover hover:shadow-[0_0_16px_rgba(34,197,94,0.3)]"
                >
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          {recommendations?.practiceProblem && (
            <div className="mb-8 rounded-xl border border-border bg-panel p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted">Recommended Practice</p>
                  <Link
                    href={`/problems/${recommendations.practiceProblem.slug}`}
                    className="text-sm font-semibold text-text-primary hover:text-accent transition-colors"
                  >
                    {recommendations.practiceProblem.title}
                  </Link>
                </div>
                <span className={`text-[10px] font-semibold capitalize ${difficultyColor[recommendations.practiceProblem.difficulty] || ""}`}>
                  {recommendations.practiceProblem.difficulty}
                </span>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-text-dim">Learning Paths</h2>
            <div className="space-y-3">
              {paths.map((path) => {
                const pathProgress = progress?.paths.find((p) => p.slug === path.slug);
                return (
                  <Link
                    key={path.slug}
                    href={`/learn/${path.slug}`}
                    className="block rounded-xl border border-border bg-panel p-5 transition-all hover:border-accent/20 hover:shadow-[0_0_20px_rgba(34,197,94,0.05)]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-text-primary">{path.title}</h3>
                        <p className="mt-1 text-xs text-text-muted">{path.description}</p>
                        <div className="mt-2.5 flex items-center gap-3">
                          <span className={`text-[10px] font-semibold capitalize ${difficultyColor[path.difficulty] || ""}`}>
                            {path.difficulty}
                          </span>
                          <span className="text-[10px] text-text-dim">{path.estimatedHours} hours</span>
                          <span className="text-[10px] text-text-dim">{path.moduleCount} modules</span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        {pathProgress ? (
                          <>
                            <p className="text-lg font-bold text-accent">{pathProgress.progressPercent.toFixed(0)}%</p>
                            <p className="text-[10px] text-text-dim">{pathProgress.completedLessons}/{pathProgress.totalLessons}</p>
                          </>
                        ) : (
                          <span className="inline-flex h-7 items-center rounded-xl bg-accent px-3 text-[10px] font-semibold text-on-accent">
                            Start
                          </span>
                        )}
                      </div>
                    </div>
                    {pathProgress && pathProgress.progressPercent > 0 && (
                      <div className="mt-3">
                        <div className="h-1 overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{ width: `${pathProgress.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {topMastery.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-text-dim">Concept Mastery</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topMastery.map((concept) => (
                  <div key={concept.slug} className="rounded-xl border border-border bg-panel p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-text-primary">{concept.name}</span>
                      <span className={`text-[10px] font-semibold ${
                        concept.level === "mastered" ? "text-accent" :
                        concept.level === "proficient" ? "text-info" :
                        concept.level === "developing" ? "text-warning" :
                        "text-text-dim"
                      }`}>
                        {concept.level}
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${concept.masteryScore}%` }}
                      />
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-text-dim">{concept.masteryScore.toFixed(0)}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weakConcepts.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-text-dim">Areas to Improve</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {weakConcepts.map((concept) => (
                  <div key={concept.slug} className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                    <p className="text-xs font-semibold text-text-primary">{concept.name}</p>
                    <p className="mt-1 text-[10px] font-semibold text-warning">{concept.masteryScore.toFixed(0)}% mastery</p>
                    <div className="mt-2">
                      <div className="h-1 overflow-hidden rounded-full bg-surface">
                        <div
                          className="h-full rounded-full bg-warning transition-all"
                          style={{ width: `${concept.masteryScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
