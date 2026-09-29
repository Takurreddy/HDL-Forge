"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { fetchUserDashboard } from "@/lib/api";
import { DashboardData } from "@/lib/types";
import {
  LayoutDashboard,
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Award,
  BookOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";

const difficultyColor: Record<string, string> = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-error",
};

const statusColor: Record<string, string> = {
  PASSED: "text-success",
  PARTIAL: "text-warning",
  FAILED: "text-error",
};

const difficultyBg: Record<string, string> = {
  easy: "bg-success",
  medium: "bg-warning",
  hard: "bg-error",
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await fetchUserDashboard();
      if (data) {
        setDashboard(data);
      }
    } catch { /* Handle error */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (user) { void fetchDashboard(); }
  }, [user, fetchDashboard]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-xl font-bold text-accent">
            {user.displayName?.[0] || user.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">{user.displayName || user.username}</h1>
            <p className="text-xs text-text-muted">@{user.username} · Joined {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-panel" />)}
        </div>
      ) : dashboard ? (
        <>
          {/* Level Card */}
          <div className="mb-6 rounded-xl border border-border bg-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-accent" />
                <span className="text-xs text-text-muted">Level</span>
              </div>
              <span className="text-xs text-text-muted">Rank #{dashboard.rank}</span>
            </div>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-3xl font-bold text-accent">{dashboard.level}</span>
              <span className="mb-1 text-xs text-text-dim">Level {dashboard.level + 1}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${dashboard.xpForNext > 0 ? (dashboard.xpInCurrentLevel / dashboard.xpForNext) * 100 : 0}%` }}
              />
            </div>
            <div className="mt-2 text-right font-mono text-[10px] text-text-dim">
              {dashboard.xpInCurrentLevel} / {dashboard.xpForNext} XP · Total: {dashboard.xp.toLocaleString()} XP
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard icon={Target} label="Solved" value={dashboard.problemsSolved} />
            <StatCard icon={Flame} label="Streak" value={`${dashboard.currentStreak}d`} />
            <StatCard icon={TrendingUp} label="Submissions" value={dashboard.totalSubmissions} />
            <StatCard icon={TrendingUp} label="Success" value={`${dashboard.successRate}%`} />
          </div>

          {/* Difficulty Breakdown */}
          {dashboard.difficultyStats.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-dim">Difficulty</h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {dashboard.difficultyStats.map((stat) => (
                  <div key={stat.difficulty} className="rounded-xl border border-border bg-panel p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold capitalize ${difficultyColor[stat.difficulty] || ""}`}>{stat.difficulty}</span>
                      <span className="font-mono text-[10px] text-text-dim">{stat.solved}/{stat.total}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-surface">
                      <div className={`h-full rounded-full ${difficultyBg[stat.difficulty] || "bg-text-dim"}`} style={{ width: `${stat.total > 0 ? (stat.solved / stat.total) * 100 : 0}%` }} />
                    </div>
                    <p className="mt-1.5 font-mono text-[10px] text-text-dim">{stat.xp} XP</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {dashboard.recentAchievements.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-dim">Recent Achievements</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {dashboard.recentAchievements.map((ach) => (
                  <div key={ach.slug} className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 p-3">
                    <span className="text-xl">{ach.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text-primary">{ach.name}</p>
                      <p className="text-[10px] text-text-dim">{ach.description}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-accent">+{ach.xpReward} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Progress */}
          {dashboard.learningProgress && dashboard.learningProgress.totalLessons > 0 && (
            <div className="mb-6 rounded-xl border border-border bg-panel p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-accent" />
                  <span className="text-xs font-semibold text-text-primary">Learning Progress</span>
                </div>
                <Link href="/learn" className="flex items-center gap-1 text-[10px] font-semibold text-accent hover:text-accent-hover transition-colors">
                  Continue <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <p className="text-lg font-bold text-accent mb-2">
                {dashboard.learningProgress.completedLessons} / {dashboard.learningProgress.totalLessons} lessons
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${dashboard.learningProgress.progressPercent}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-text-dim">
                <span>{dashboard.learningProgress.progressPercent.toFixed(0)}% complete</span>
                <span>{dashboard.learningProgress.conceptsMastered} concepts mastered</span>
              </div>
            </div>
          )}

          {/* Recent Submissions */}
          {dashboard.recentSubmissions.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-dim">Recent Submissions</h2>
              <div className="space-y-1.5">
                {dashboard.recentSubmissions.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/problems/${sub.problemSlug}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-panel px-4 py-3 transition-all hover:border-accent/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-text-primary">{sub.problemTitle}</span>
                      <span className={`text-[10px] font-semibold capitalize ${difficultyColor[sub.difficulty] || ""}`}>{sub.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-xs font-semibold ${statusColor[sub.status] || "text-text-muted"}`}>{sub.score}%</span>
                      <span className="text-[10px] text-text-dim">{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Problem Progress */}
          {dashboard.problemProgress.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-dim">Problem Progress</h2>
              <div className="space-y-1.5">
                {dashboard.problemProgress.map((item) => (
                  <Link
                    key={item.problemId}
                    href={`/problems/${item.slug}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-panel px-4 py-3 transition-all hover:border-accent/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-text-primary">{item.title}</span>
                      <span className={`text-[10px] font-semibold capitalize ${difficultyColor[item.difficulty] || ""}`}>{item.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-semibold ${item.status === "SOLVED" ? "text-accent" : "text-text-muted"}`}>{item.status}</span>
                      <span className="font-mono text-[10px] text-text-dim">{item.bestScore}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-border bg-panel p-12 text-center">
          <LayoutDashboard className="mx-auto mb-3 h-8 w-8 text-text-dim" />
          <p className="text-sm text-text-muted">No data yet. Start solving problems!</p>
          <Link
            href="/problems"
            className="mt-4 inline-flex h-8 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-semibold text-[#070707] transition-all hover:bg-accent-hover"
          >
            Browse Problems
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-panel p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-accent" />
        <span className="text-[10px] text-text-dim">{label}</span>
      </div>
      <div className="text-lg font-bold text-text-primary">{value}</div>
    </div>
  );
}
