"use client";

import Link from "next/link";
import { Problem } from "@/lib/types";
import DifficultyBadge from "./DifficultyBadge";
import CategoryBadge from "./CategoryBadge";
import { ChevronRight, Lock, CheckCircle2, Cpu, ArrowRight, Sparkles, Circle } from "lucide-react";

interface ProblemCardProps {
  problem: Problem;
  isSolved?: boolean;
}

// Brand accent colors for hardware companies with crisp light mode contrast
const COMPANY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  nvidia: { bg: "bg-emerald-600/10 dark:bg-[#76B900]/10", text: "text-emerald-700 dark:text-[#76B900]", border: "border-emerald-500/25 dark:border-[#76B900]/30" },
  apple: { bg: "bg-slate-500/10 dark:bg-zinc-200/10", text: "text-slate-700 dark:text-zinc-200", border: "border-slate-300 dark:border-zinc-300/30" },
  intel: { bg: "bg-blue-600/10 dark:bg-[#0071C5]/15", text: "text-blue-700 dark:text-[#00A3FF]", border: "border-blue-500/25 dark:border-[#0071C5]/40" },
  qualcomm: { bg: "bg-indigo-600/10 dark:bg-[#3253DC]/15", text: "text-indigo-700 dark:text-[#6080FF]", border: "border-indigo-500/25 dark:border-[#3253DC]/40" },
  amd: { bg: "bg-rose-600/10 dark:bg-[#ED1C24]/10", text: "text-rose-700 dark:text-[#FF4A50]", border: "border-rose-500/25 dark:border-[#ED1C24]/30" },
  google: { bg: "bg-blue-600/10 dark:bg-[#4285F4]/15", text: "text-blue-700 dark:text-[#4285F4]", border: "border-blue-500/25 dark:border-[#4285F4]/35" },
  arm: { bg: "bg-sky-600/10 dark:bg-[#0091BD]/15", text: "text-sky-700 dark:text-[#00C2FF]", border: "border-sky-500/25 dark:border-[#0091BD]/40" },
};

export default function ProblemCard({ problem, isSolved = false }: ProblemCardProps) {
  const isChip =
    problem.category?.toLowerCase().includes("chip") ||
    problem.slug.includes("chip");

  return (
    <Link
      href={problem.locked ? "#" : `/problems/${problem.slug}`}
      className={`group relative block rounded-2xl border border-border/80 bg-panel/90 p-4 sm:p-5 transition-all duration-300 hover:border-accent/50 hover:bg-surface/70 hover:shadow-md dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_24px_rgba(0,217,165,0.08)] ${
        problem.locked ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Status Icon, Title, Description, Badges */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            {/* Status indicator (Solved / Unsolved) */}
            <div className="shrink-0">
              {isSolved ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              ) : (
                <div className="h-4 w-4 rounded-full border border-border/80 text-text-dim group-hover:border-accent/40" />
              )}
            </div>

            {/* Chip Design Badge icon */}
            {isChip ? (
              <span className="flex items-center gap-1 rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-accent border border-accent/30">
                <Cpu className="h-3 w-3" />
                Chip Architecture
              </span>
            ) : null}

            {/* Problem Title */}
            <h3 className="truncate text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
              {problem.title}
            </h3>

            {problem.locked && (
              <Lock className="h-3 w-3 shrink-0 text-text-dim" />
            )}
          </div>

          {/* Problem summary line */}
          <p className="line-clamp-1 text-xs text-text-muted mb-3 font-sans leading-relaxed pl-6 sm:pl-7">
            {problem.description}
          </p>

          {/* Badges & Meta row */}
          <div className="flex flex-wrap items-center gap-2 pl-6 sm:pl-7">
            <DifficultyBadge difficulty={problem.difficulty} size="sm" />
            <CategoryBadge category={problem.category} size="sm" />

            <span className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-mono font-semibold text-text-dim border border-border">
              {problem.language?.toUpperCase() || "SV"}
            </span>

            {/* Branded Company Pills */}
            {problem.companyTags && problem.companyTags.length > 0 && (
              <div className="flex items-center gap-1.5">
                {problem.companyTags.slice(0, 3).map((comp) => {
                  const style =
                    COMPANY_STYLES[comp.toLowerCase()] || {
                      bg: "bg-accent/10",
                      text: "text-accent",
                      border: "border-accent/20",
                    };
                  return (
                    <span
                      key={comp}
                      className={`rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}
                    >
                      {comp}
                    </span>
                  );
                })}
                {problem.companyTags.length > 3 && (
                  <span className="text-[9px] font-mono text-text-dim">
                    +{problem.companyTags.length - 3}
                  </span>
                )}
              </div>
            )}

            {problem.timeComplexity && (
              <span className="hidden sm:inline text-[10px] font-mono text-text-dim">
                Latency: <span className="text-text-secondary">{problem.timeComplexity}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Solve CTA Button */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-accent opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
            <span>Solve</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border text-text-dim group-hover:border-accent/40 group-hover:text-accent group-hover:bg-accent/10 transition-all">
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
