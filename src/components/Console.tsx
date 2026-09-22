"use client";

import { SubmissionResult } from "@/lib/types";
import { Terminal, CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";

interface ConsoleProps {
  result: SubmissionResult | null;
  isRunning: boolean;
}

export default function Console({ result, isRunning }: ConsoleProps) {
  const [collapsed, setCollapsed] = useState(false);

  const getStatusConfig = () => {
    if (isRunning) return { color: "text-warning", bg: "bg-warning/5", border: "border-warning/20", label: "Running..." };
    if (!result) return { color: "text-text-muted", bg: "bg-panel", border: "border-border", label: null };
    switch (result.status) {
      case "PASSED": return { color: "text-success", bg: "bg-success/5", border: "border-success/20", label: "All tests passed" };
      case "PARTIAL": return { color: "text-warning", bg: "bg-warning/5", border: "border-warning/20", label: "Some tests passed" };
      case "FAILED": return { color: "text-error", bg: "bg-error/5", border: "border-error/20", label: "Some tests failed" };
      case "COMPILATION_ERROR": return { color: "text-error", bg: "bg-error/5", border: "border-error/20", label: "Compilation failed" };
      case "RUNTIME_ERROR": return { color: "text-error", bg: "bg-error/5", border: "border-error/20", label: "Runtime error" };
      case "TIME_LIMIT_EXCEEDED": return { color: "text-warning", bg: "bg-warning/5", border: "border-warning/20", label: "Time limit exceeded" };
      case "JUDGE_ERROR": return { color: "text-error", bg: "bg-error/5", border: "border-error/20", label: "Judge error" };
      default: return { color: "text-text-muted", bg: "bg-panel", border: "border-border", label: null };
    }
  };

  const status = getStatusConfig();

  return (
    <div className={`rounded-xl border ${status.border} ${status.bg} overflow-hidden`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 border-b border-border px-4 py-3 transition-colors hover:bg-surface/50"
      >
        <Terminal className="h-3.5 w-3.5 text-text-muted" />
        <span className="text-xs font-medium text-text-secondary">Console</span>
        {isRunning && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-warning">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running...
          </span>
        )}
        {result && !isRunning && (
          <span className={`ml-auto text-xs font-semibold ${status.color}`}>
            {status.label}
          </span>
        )}
        <div className="ml-2 text-text-dim">
          {collapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {!collapsed && (
        <div className="p-4">
          {!result && !isRunning && (
            <p className="font-mono text-xs text-text-dim">
              Ready to run your solution...
            </p>
          )}
          {isRunning && (
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-warning" />
              <p className="font-mono text-xs text-warning">
                Running simulation...
              </p>
            </div>
          )}
          {result && !isRunning && (
            <div className="space-y-3">
              {result.compilationMessage && result.status === "COMPILATION_ERROR" && (
                <div className="rounded-lg bg-error/10 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-error">
                    <XCircle className="h-3.5 w-3.5" />
                    Compilation Error
                  </div>
                  <pre className="mt-2 overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
                    {result.compilationMessage}
                  </pre>
                </div>
              )}

              {result.compilationMessage && result.status !== "COMPILATION_ERROR" && (
                <div className="text-xs text-text-muted">
                  {result.compilationMessage}
                </div>
              )}

              {result.status === "TIME_LIMIT_EXCEEDED" && (
                <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2.5 text-xs text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Execution timed out. Your code may contain an infinite loop.
                </div>
              )}

              {result.status === "RUNTIME_ERROR" && (
                <div className="flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2.5 text-xs text-error">
                  <XCircle className="h-3.5 w-3.5" />
                  Runtime error during simulation.
                </div>
              )}

              {result.status === "error" && (
                <div className="flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2.5 text-xs text-error">
                  <XCircle className="h-3.5 w-3.5" />
                  {result.compilationMessage || "An error occurred."}
                </div>
              )}

              {result.tests.length > 0 && (
                <div className="space-y-1">
                  {result.tests.map((test) => (
                    <div
                      key={test.name}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 font-mono text-xs transition-colors hover:bg-surface/50"
                    >
                      {test.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-error" />
                      )}
                      <span className={test.passed ? "text-text-secondary" : "text-error"}>
                        {test.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {result.tests.some((t) => !t.passed && (t.expected || t.received)) && (
                <div className="space-y-1.5">
                  {result.tests
                    .filter((t) => !t.passed && (t.expected || t.received))
                    .map((test) => (
                      <div
                        key={test.name}
                        className="rounded-lg bg-error/5 px-3 py-2.5 border border-error/10"
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold text-error">
                          <XCircle className="h-3.5 w-3.5" />
                          {test.name}
                        </div>
                        {test.expected && test.received && (
                          <div className="mt-1.5 font-mono text-xs text-text-muted">
                            <div>
                              Expected: <span className="text-text-secondary">{test.expected}</span>
                            </div>
                            <div>
                              Received: <span className="text-error">{test.received}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {result.testsTotal > 0 && (
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="font-mono text-xs text-text-muted">
                    Tests:{" "}
                    <span className="font-semibold text-text-secondary">
                      {result.testsPassed}/{result.testsTotal}
                    </span>
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      result.score === 100
                        ? "text-success"
                        : result.score >= 50
                          ? "text-warning"
                          : "text-error"
                    }`}
                  >
                    {result.score}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
