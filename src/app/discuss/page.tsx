"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProblems } from "@/lib/api";
import { CATEGORY_LABELS, Problem } from "@/lib/types";
import { MessageSquare, ChevronRight, Loader2, Lock } from "lucide-react";

export default function DiscussPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProblems()
      .then((data) => setProblems(data.problems))
      .catch(() => {
        // Handle error
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Discussion</h1>
          <p className="mt-1 text-sm text-text-muted">
            Ask questions and share solutions with the community, right below each problem.
          </p>
        </div>
        {!loading && (
          <span className="text-sm text-text-muted">
            {problems.length} {problems.length === 1 ? "topic" : "topics"}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-panel">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-text-dim" />
          </div>
        ) : problems.length === 0 ? (
          <div className="py-24 text-center">
            <MessageSquare className="mx-auto mb-3 h-8 w-8 text-text-dim" />
            <p className="text-sm text-text-muted">No discussions available yet.</p>
          </div>
        ) : (
          <>
            <div className="border-b border-border text-xs font-medium text-text-muted">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1">Topic</span>
                <span className="hidden w-32 sm:block">Category</span>
                <span className="hidden w-32 lg:block">Language</span>
              </div>
            </div>
            <div className="divide-y divide-border/60">
              {problems.map((problem) => (
                <Link
                  key={problem.slug}
                  href={`/problems/${problem.slug}?tab=discussion`}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface/60"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {problem.locked ? (
                      <Lock className="h-4 w-4 shrink-0 text-text-dim" />
                    ) : (
                      <MessageSquare className="h-4 w-4 shrink-0 text-accent" />
                    )}
                    <span className="truncate text-sm font-medium text-text-primary transition-colors group-hover:text-accent">
                      {problem.title}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-dim opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <span className="hidden w-32 text-sm text-text-secondary sm:block">
                    {CATEGORY_LABELS[problem.category as keyof typeof CATEGORY_LABELS] ??
                      problem.category}
                  </span>
                  <span className="hidden w-32 font-mono text-sm text-text-secondary lg:block">
                    {problem.language === "systemverilog" ? "SystemVerilog" : "Verilog"}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}