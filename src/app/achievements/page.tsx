"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchMyAchievements } from "@/lib/api";
import { Achievement, UserAchievementsResponse } from "@/lib/types";
import { Award, Trophy, Lock } from "lucide-react";

export default function AchievementsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<UserAchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAchievements = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await fetchMyAchievements();
      setData(result);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadAchievements(); }, [loadAchievements]);

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <p className="text-sm text-text-muted">Please log in to view achievements.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
            <Award className="h-5 w-5 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Achievements</h1>
        </div>
        <p className="text-sm text-text-muted">Track your HDL mastery milestones</p>
      </div>

      {data && (
        <div className="mb-8 rounded-xl border border-border bg-panel p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">Achievements Unlocked</p>
              <p className="text-2xl font-bold text-accent">
                {data.totalUnlocked} / {data.totalAvailable}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              {data.totalUnlocked === data.totalAvailable ? (
                <Trophy className="h-6 w-6 text-accent" />
              ) : (
                <Award className="h-6 w-6 text-accent" />
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-panel" />
          ))}
        </div>
      ) : data ? (
        <>
          {data.achievements.filter((a) => a.unlocked).length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-accent">Unlocked</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.achievements.filter((a) => a.unlocked).map((ach) => (
                  <AchievementCard key={ach.slug} achievement={ach} />
                ))}
              </div>
            </div>
          )}

          {data.achievements.filter((a) => !a.unlocked).length > 0 && (
            <div>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-text-dim">Locked</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.achievements.filter((a) => !a.unlocked).map((ach) => (
                  <AchievementCard key={ach.slug} achievement={ach} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-border bg-panel p-12 text-center">
          <Award className="mx-auto mb-3 h-8 w-8 text-text-dim" />
          <p className="text-sm text-text-muted">No achievements yet. Start solving problems!</p>
        </div>
      )}
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const percent =
    achievement.progressTarget > 0
      ? Math.round((achievement.progressCurrent / achievement.progressTarget) * 100)
      : 0;

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        achievement.unlocked
          ? "border-accent/20 bg-accent/5 hover:shadow-[0_0_16px_rgba(0,217,165,0.08)]"
          : "border-border bg-panel"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
            achievement.unlocked ? "bg-accent/10" : "bg-surface"
          }`}
        >
          {achievement.unlocked ? achievement.icon : <Lock className="h-4 w-4 text-text-dim" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-xs font-semibold ${achievement.unlocked ? "text-text-primary" : "text-text-muted"}`}>
            {achievement.name}
          </h3>
          <p className="mt-0.5 text-[10px] text-text-dim">{achievement.description}</p>
        </div>
        <span className="text-[10px] font-semibold text-accent">+{achievement.xpReward} XP</span>
      </div>

      {!achievement.unlocked && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[10px] text-text-dim">
              {achievement.progressCurrent}/{achievement.progressTarget}
            </span>
            <span className="font-mono text-[10px] text-text-dim">{percent}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-accent/40 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {achievement.unlocked && achievement.unlockedAt && (
        <p className="mt-2 text-[10px] text-text-dim">
          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
