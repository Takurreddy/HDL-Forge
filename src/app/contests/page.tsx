"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchContests } from "@/lib/api";
import { Contest } from "@/lib/types";
import {
  Trophy,
  Calendar,
  Clock,
  Users,
  Award,
  ArrowRight,
  Flame,
  CheckCircle2,
  Cpu,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import DifficultyBadge from "@/components/DifficultyBadge";

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredMap, setRegisteredMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchContests();
        setContests(data);
        const reg: Record<string, boolean> = {};
        data.forEach((c) => {
          reg[c.id] = c.registered;
        });
        setRegisteredMap(reg);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const handleToggleRegister = (contestId: string) => {
    setRegisteredMap((prev) => ({
      ...prev,
      [contestId]: !prev[contestId],
    }));
  };

  const upcomingContests = contests.filter((c) => c.status === "upcoming" || c.status === "active");
  const pastContests = contests.filter((c) => c.status === "past");
  const featuredContest = upcomingContests[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-panel p-6 shadow-xl">
        <div className="absolute right-0 top-0 h-48 w-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Trophy className="h-4 w-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary">
                Hardware & VLSI Design Contests
              </h1>
            </div>
            <p className="text-xs text-text-muted max-w-md leading-relaxed">
              Compete live with ECE, EEE, and semiconductor engineers worldwide. Solve timed RTL microarchitecture problems, climb global ratings, and win interview fast-tracks.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-surface/80 rounded-xl p-3 border border-border shrink-0">
            <div className="text-center px-3 border-r border-border">
              <span className="text-lg font-bold text-accent">90m</span>
              <span className="text-[10px] text-text-dim block uppercase font-semibold">Duration</span>
            </div>
            <div className="text-center px-3 border-r border-border">
              <span className="text-lg font-bold text-text-primary">4</span>
              <span className="text-[10px] text-text-dim block uppercase font-semibold">Problems</span>
            </div>
            <div className="text-center px-2">
              <span className="text-lg font-bold text-success">100%</span>
              <span className="text-[10px] text-text-dim block uppercase font-semibold">Simulated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Contest Card */}
      {featuredContest && (
        <div className="relative overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-panel via-surface to-[#0A1210] p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-md bg-accent/20 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-accent border border-accent/30">
                  Featured Weekly Event
                </span>
                <span className="flex items-center gap-1.5 rounded-md bg-surface px-2.5 py-1 text-xs font-mono text-text-secondary border border-border">
                  <Clock className="h-3.5 w-3.5 text-accent" />
                  {featuredContest.durationMinutes} Minutes
                </span>
                <span className="flex items-center gap-1.5 rounded-md bg-surface px-2.5 py-1 text-xs font-mono text-text-secondary border border-border">
                  <Users className="h-3.5 w-3.5 text-accent" />
                  {featuredContest.registeredCount.toLocaleString()} Registered
                </span>
              </div>

              <h2 className="text-xl font-bold text-text-primary">
                {featuredContest.title}
              </h2>

              <p className="text-xs text-text-muted max-w-xl leading-relaxed">
                {featuredContest.description}
              </p>

              {featuredContest.sponsor && (
                <div className="flex items-center gap-2 rounded-xl bg-surface/60 border border-border/80 px-3 py-2 text-xs">
                  <Award className="h-4 w-4 text-warning shrink-0" />
                  <div>
                    <span className="font-semibold text-text-primary">
                      {featuredContest.sponsor.name}
                    </span>
                    <span className="text-text-muted text-[11px] block">
                      {featuredContest.sponsor.tagline}
                    </span>
                  </div>
                </div>
              )}

              {/* Problem preview chips */}
              <div className="pt-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-2">
                  Contest Problem Breakdown
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {featuredContest.problems.map((prob, i) => (
                    <div
                      key={prob.id}
                      className="rounded-lg border border-border bg-surface/50 p-2 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-text-dim text-[10px]">Q{i + 1}</span>
                        <DifficultyBadge difficulty={prob.difficulty} size="sm" />
                      </div>
                      <div className="font-semibold text-text-primary truncate text-[11px]">
                        {prob.title}
                      </div>
                      <div className="text-[10px] font-mono text-accent mt-0.5">
                        {prob.points} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Registration CTA box */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface/90 p-5 shrink-0 text-center min-w-[220px]">
              <div className="mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim block">
                  Contest Begins
                </span>
                <span className="text-sm font-bold text-text-primary font-mono block mt-0.5">
                  {new Date(featuredContest.startTime).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <button
                onClick={() => handleToggleRegister(featuredContest.id)}
                className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md active:scale-95 ${
                  registeredMap[featuredContest.id]
                    ? "bg-success/20 text-success border border-success/40"
                    : "bg-accent text-[#070707] hover:bg-accent-hover hover:shadow-[0_0_16px_rgba(0,217,165,0.3)]"
                }`}
              >
                {registeredMap[featuredContest.id] ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>Registered</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Register Now</span>
                  </>
                )}
              </button>

              <span className="text-[10px] text-text-dim mt-2 block">
                Free entry • Verilog / SystemVerilog
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming & Past Contests Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" />
          <span>All Scheduled Contests</span>
        </h3>

        <div className="space-y-3">
          {contests.map((c) => {
            const isRegistered = registeredMap[c.id];
            const isPast = c.status === "past";

            return (
              <div
                key={c.id}
                className="rounded-xl border border-border bg-panel p-4 transition-all hover:border-accent/30 hover:bg-surface/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-mono font-bold text-accent">
                        #{c.edition}
                      </span>
                      <h4 className="text-sm font-bold text-text-primary">
                        {c.title}
                      </h4>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold ${
                          isPast
                            ? "bg-surface text-text-dim border border-border"
                            : "bg-accent/10 text-accent border border-accent/20"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <p className="line-clamp-1 text-xs text-text-muted mb-2">
                      {c.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-text-dim">
                      <span>{c.durationMinutes} mins</span>
                      <span>•</span>
                      <span>{c.problems.length} problems</span>
                      <span>•</span>
                      <span>{c.registeredCount.toLocaleString()} participants</span>
                      {c.sponsor && (
                        <>
                          <span>•</span>
                          <span className="text-accent font-semibold">{c.sponsor.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isPast ? (
                      <Link
                        href={`/problems/${c.problems[0]?.slug || "and-gate"}`}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-accent/40 hover:text-accent transition-all"
                      >
                        <span>Practice Virtual</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleToggleRegister(c.id)}
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                          isRegistered
                            ? "bg-success/15 text-success border border-success/30"
                            : "bg-surface text-text-primary border border-border hover:border-accent hover:text-accent"
                        }`}
                      >
                        {isRegistered ? "Registered" : "Register"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contest Rules FAQ */}
      <div className="rounded-xl border border-border bg-panel p-5 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <span>Hardware Contest Rules & Judging</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-text-muted">
          <div className="rounded-lg bg-surface/50 border border-border/50 p-3">
            <span className="font-semibold text-text-primary block mb-1">
              1. Simulation Testing
            </span>
            Submissions are compiled with Icarus Verilog / Verilator in sandboxed containers and validated against hidden dynamic test vectors.
          </div>
          <div className="rounded-lg bg-surface/50 border border-border/50 p-3">
            <span className="font-semibold text-text-primary block mb-1">
              2. Latency & Clock Speed
            </span>
            Ties are broken by clock cycle count and pipeline latency targets defined in problem constraints.
          </div>
          <div className="rounded-lg bg-surface/50 border border-border/50 p-3">
            <span className="font-semibold text-text-primary block mb-1">
              3. Recruiter Referrals
            </span>
            Top 10 leaderboard rankers receive interview opportunities and fast-track referrals from partner semiconductor firms.
          </div>
        </div>
      </div>
    </div>
  );
}
