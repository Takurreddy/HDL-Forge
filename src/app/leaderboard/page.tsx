"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { fetchLeaderboard, fetchMyRank } from "@/lib/api";
import { LeaderboardEntry, LeaderboardResponse, UserRankResponse } from "@/lib/types";
import { Trophy, Search, ChevronLeft, ChevronRight, Medal, Flame, Award, Target } from "lucide-react";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [myRank, setMyRank] = useState<UserRankResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLeaderboard({ page, limit: 20, search: search || undefined });
      setLeaderboard(data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const loadMyRank = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchMyRank();
      setMyRank(data);
    } catch {
      // Handle error
    }
  }, [user]);

  useEffect(() => { void loadLeaderboard(); }, [loadLeaderboard]);
  useEffect(() => { void loadMyRank(); }, [loadMyRank]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
            <Trophy className="h-5 w-5 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Leaderboard</h1>
        </div>
        <p className="text-sm text-text-muted">Top HDL engineers ranked by XP</p>
      </div>

      {/* Current User Rank Card */}
      {user && myRank && (
        <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-text-muted">Your Rank</p>
              <p className="text-3xl font-bold text-accent">#{myRank.rank}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Level {myRank.level}</p>
              <p className="text-lg font-semibold text-text-primary">{myRank.xp.toLocaleString()} XP</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-surface/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Target className="h-3 w-3 text-accent" />
                <span className="text-[10px] text-text-dim">Solved</span>
              </div>
              <span className="text-sm font-bold text-text-primary">{myRank.solvedCount}</span>
            </div>
            <div className="rounded-lg bg-surface/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Trophy className="h-3 w-3 text-accent" />
                <span className="text-[10px] text-text-dim">Progress</span>
              </div>
              <span className="text-sm font-bold text-text-primary">{myRank.progress}%</span>
            </div>
            <div className="rounded-lg bg-surface/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Flame className="h-3 w-3 text-warning" />
                <span className="text-[10px] text-text-dim">Streak</span>
              </div>
              <span className="text-sm font-bold text-text-primary">{myRank.streak}d</span>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-9 w-full rounded-xl border border-border bg-panel pl-9 pr-3 text-xs text-text-primary placeholder-text-dim outline-none transition-all focus:border-accent/40 focus:shadow-[0_0_12px_rgba(34,197,94,0.1)]"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-panel" />
          ))}
        </div>
      ) : leaderboard && leaderboard.entries.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-panel">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-dim">Rank</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-dim">User</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-text-dim">Level</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-text-dim">XP</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-text-dim">Solved</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-text-dim">Progress</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-text-dim">Streak</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-text-dim">Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaderboard.entries.map((entry) => (
                  <tr
                    key={entry.userId}
                    className={`transition-colors hover:bg-surface/50 ${
                      user && entry.userId === user.id ? "bg-accent/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${
                        entry.rank === 1 ? "text-warning" :
                        entry.rank === 2 ? "text-text-secondary" :
                        entry.rank === 3 ? "text-warning/70" :
                        "text-text-muted"
                      }`}>
                        {entry.rank <= 3 ? (
                          <Medal className={`h-4 w-4 ${entry.rank === 1 ? "text-warning" : entry.rank === 2 ? "text-text-secondary" : "text-warning/70"}`} />
                        ) : (
                          `#${entry.rank}`
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-[10px] font-bold text-accent">
                          {(entry.displayName || entry.username)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-text-primary">{entry.displayName || entry.username}</p>
                          <p className="text-[10px] text-text-dim">@{entry.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center rounded-lg bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        Lv.{entry.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-xs font-semibold text-text-primary">{entry.xp.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-xs text-text-muted">{entry.solvedCount}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${Math.min(entry.progress, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-text-dim">{entry.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {entry.streak > 0 && <Flame className="h-3 w-3 text-warning" />}
                        <span className="font-mono text-xs text-text-muted">{entry.streak}d</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {entry.achievements > 0 && <Award className="h-3 w-3 text-accent" />}
                        <span className="font-mono text-xs text-text-muted">{entry.achievements}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {leaderboard.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 items-center gap-1 rounded-xl border border-border bg-surface px-3 text-xs text-text-secondary transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-text-primary disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <span className="px-3 text-xs text-text-muted">
                {page} / {leaderboard.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(leaderboard.totalPages, p + 1))}
                disabled={page === leaderboard.totalPages}
                className="flex h-8 items-center gap-1 rounded-xl border border-border bg-surface px-3 text-xs text-text-secondary transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-text-primary disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-border bg-panel p-12 text-center">
          <Trophy className="mx-auto mb-3 h-8 w-8 text-text-dim" />
          <p className="text-sm text-text-muted">No users on the leaderboard yet.</p>
          <Link
            href="/problems"
            className="mt-4 inline-flex h-8 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-semibold text-on-accent transition-all hover:bg-accent-hover"
          >
            Be the First
          </Link>
        </div>
      )}
    </div>
  );
}
