"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchProblems } from "@/lib/api";
import { CATEGORY_LABELS, Difficulty, Problem } from "@/lib/types";
import { Search, Code2, Lock, Circle, ChevronRight } from "lucide-react";

const DIFFICULTY_TEXT: Record<Difficulty, string> = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-error",
};

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const DIFFICULTY_OPTIONS = [
  { value: "all", label: "All" },
  ...(Object.keys(DIFFICULTY_TEXT) as Difficulty[]).map((d) => ({
    value: d,
    label: DIFFICULTY_LABEL[d],
  })),
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "combinational", label: "Combinational" },
  { value: "sequential", label: "Sequential" },
  { value: "fsm", label: "FSM" },
  { value: "arithmetic", label: "Arithmetic" },
  { value: "memory", label: "Memory" },
  { value: "protocols", label: "Protocols" },
];

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");

  const loadProblems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProblems({
        difficulty: difficulty !== "all" ? difficulty : undefined,
        category: category !== "all" ? category : undefined,
        search: search || undefined,
      });
      setProblems(data.problems);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [difficulty, category, search]);

  useEffect(() => {
    void loadProblems();
  }, [loadProblems]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Problems</h1>
        {!loading && (
          <span className="text-sm text-text-muted">
            {problems.length} {problems.length === 1 ? "problem" : "problems"}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_minmax(0,240px)_minmax(0,260px)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problem titles..."
            className="h-10 w-full rounded-lg border border-border bg-panel pl-9 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="h-10 rounded-lg border border-border bg-panel px-3 text-sm text-text-secondary outline-none transition-colors focus:border-accent/40"
        >
          {DIFFICULTY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-lg border border-border bg-panel px-3 text-sm text-text-secondary outline-none transition-colors focus:border-accent/40"
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-panel">
        {loading ? (
          <div className="p-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-surface/50" />
            ))}
          </div>
        ) : problems.length === 0 ? (
          <div className="py-24 text-center">
            <Code2 className="mx-auto mb-3 h-8 w-8 text-text-dim" />
            <p className="text-sm text-text-muted">No problems found.</p>
          </div>
        ) : (
          <>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-xs font-medium text-text-muted">
                  <th className="w-12 px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Category</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Language</th>
                  <th className="px-4 py-3 text-right font-medium">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {problems.map((problem) => (
                  <tr
                    key={problem.slug}
                    className={`group transition-colors hover:bg-surface/60 ${
                      problem.locked ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      {problem.locked ? (
                        <Lock className="h-4 w-4 text-text-dim" />
                      ) : (
                        <Circle className="h-4 w-4 text-text-dim/60" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {problem.locked ? (
                        <span className="flex items-center gap-1 text-sm text-text-secondary">
                          {problem.title}
                        </span>
                      ) : (
                        <Link
                          href={`/problems/${problem.slug}`}
                          className="group flex items-center gap-1 text-sm font-medium text-text-primary transition-colors hover:text-accent"
                        >
                          {problem.title}
                          <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-sm text-text-secondary">
                        {CATEGORY_LABELS[problem.category as keyof typeof CATEGORY_LABELS] ?? problem.category}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="font-mono text-sm text-text-secondary">
                        {problem.language === "systemverilog" ? "SystemVerilog" : "Verilog"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-semibold ${DIFFICULTY_TEXT[problem.difficulty]}`}>
                        {DIFFICULTY_LABEL[problem.difficulty]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}