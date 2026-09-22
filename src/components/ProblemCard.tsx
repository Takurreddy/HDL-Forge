import Link from "next/link";
import { Problem } from "@/lib/types";
import DifficultyBadge from "./DifficultyBadge";
import CategoryBadge from "./CategoryBadge";
import { ChevronRight, Lock } from "lucide-react";

interface ProblemCardProps {
  problem: Problem;
}

export default function ProblemCard({ problem }: ProblemCardProps) {
  return (
    <Link
      href={problem.locked ? "#" : `/problems/${problem.slug}`}
      className={`group block rounded-xl border border-border bg-panel p-5 transition-all hover:border-accent/20 hover:shadow-[0_0_20px_rgba(34,197,94,0.05)] ${problem.locked ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              {problem.title}
            </h3>
            {problem.locked && (
              <Lock className="h-3 w-3 shrink-0 text-text-dim" />
            )}
          </div>
          <p className="mb-3 line-clamp-2 text-xs text-text-muted leading-relaxed">
            {problem.description}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <DifficultyBadge difficulty={problem.difficulty} />
            <CategoryBadge category={problem.category} />
          </div>
        </div>
        <div className="shrink-0 pt-1 text-text-dim transition-colors group-hover:text-accent">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
