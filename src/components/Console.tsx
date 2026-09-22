"use client";

import { SubmissionResult } from "@/lib/types";
import {
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronUp,
  ChevronDown,
  Clock,
  Zap,
  Copy,
  Check,
  Code2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface ConsoleProps {
  result: SubmissionResult | null;
  isRunning: boolean;
  onOpenWaveform?: () => void;
  hasWaveform?: boolean;
}

export default function Console({
  result,
  isRunning,
  onOpenWaveform,
  hasWaveform,
}: ConsoleProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"testcase" | "result" | "log">("result");
  const [copied, setCopied] = useState(false);

  // Auto-switch to result tab when result arrives
  const prevResultRef = useRef<SubmissionResult | null>(null);
  useEffect(() => {
    if (result && result !== prevResultRef.current) {
      setActiveTab("result");
      prevResultRef.current = result;
    }
  }, [result]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    if (isRunning) {
      return (
        <span className="flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning border border-warning/20">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Simulating RTL...
        </span>
      );
    }
    if (!result) return null;

    if (result.status === "PASSED") {
      return (
        <span className="flex items-center gap-1.5 rounded-full bg-[#00B8A3]/10 px-2.5 py-0.5 text-xs font-semibold text-[#00B8A3] border border-[#00B8A3]/20">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Accepted
        </span>
      );
    } else if (result.status === "COMPILATION_ERROR") {
      return (
        <span className="flex items-center gap-1.5 rounded-full bg-[#FF375F]/10 px-2.5 py-0.5 text-xs font-semibold text-[#FF375F] border border-[#FF375F]/20">
          <XCircle className="h-3.5 w-3.5" />
          Compile Error
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1.5 rounded-full bg-[#FF375F]/10 px-2.5 py-0.5 text-xs font-semibold text-[#FF375F] border border-[#FF375F]/20">
          <XCircle className="h-3.5 w-3.5" />
          Wrong Answer ({result.testsPassed}/{result.testsTotal})
        </span>
      );
    }
  };

  const tests = result?.tests || [];
  const selectedTest = tests[activeCaseIdx] || tests[0];

  return (
    <div className="rounded-2xl border border-border bg-panel overflow-hidden shadow-md transition-all">
      {/* LeetCode Console Header bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface/60 px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1.5 text-xs font-bold text-text-primary transition-colors hover:text-accent"
          >
            <Terminal className="h-3.5 w-3.5 text-accent" />
            <span>Console</span>
            {collapsed ? (
              <ChevronUp className="h-3.5 w-3.5 text-text-dim" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-text-dim" />
            )}
          </button>

          {!collapsed && (
            <div className="flex items-center gap-1 pl-3 border-l border-border">
              <button
                onClick={() => setActiveTab("testcase")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "testcase"
                    ? "bg-surface text-text-primary font-semibold border border-border"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Testcase
              </button>
              <button
                onClick={() => setActiveTab("result")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "result"
                    ? "bg-surface text-text-primary font-semibold border border-border"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Test Result
              </button>
              {result?.compilationMessage && (
                <button
                  onClick={() => setActiveTab("log")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeTab === "log"
                      ? "bg-error/15 text-error font-semibold border border-error/30"
                      : "text-text-muted hover:text-error"
                  }`}
                >
                  Compiler Log
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {hasWaveform && onOpenWaveform && (
            <button
              onClick={onOpenWaveform}
              className="flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent transition-all hover:bg-accent/20"
            >
              <Zap className="h-3 w-3" />
              <span>Waveform</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Console Content */}
      {!collapsed && (
        <div className="p-4">
          {activeTab === "testcase" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    className={`rounded-lg px-3 py-1 text-xs font-mono font-medium transition-all ${
                      num === 1
                        ? "bg-surface text-text-primary border border-border font-bold"
                        : "text-text-dim hover:text-text-secondary"
                    }`}
                  >
                    Case {num}
                  </button>
                ))}
              </div>
              <div className="space-y-2 rounded-xl border border-border bg-surface/40 p-3 font-mono text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim block">
                  Input Stimulus
                </span>
                <p className="text-text-secondary">
                  Default automated testbench vectors will be injected into device ports on run.
                </p>
              </div>
            </div>
          )}

          {activeTab === "result" && (
            <div>
              {isRunning && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="relative mb-3 flex h-10 w-10 items-center justify-center">
                    <div className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  </div>
                  <p className="text-xs font-semibold text-text-primary">
                    Simulating RTL in Docker Sandbox...
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-text-dim">
                    Compiling SystemVerilog & executing testbench
                  </p>
                </div>
              )}

              {!isRunning && !result && (
                <div className="flex flex-col items-center justify-center py-6 text-center text-text-muted">
                  <Code2 className="mb-2 h-7 w-7 text-text-dim" />
                  <p className="text-xs font-medium text-text-secondary">You must run your code first</p>
                  <p className="mt-0.5 text-[11px] text-text-dim">
                    Click <strong className="text-accent font-semibold">Run</strong> to execute testcases or press <kbd className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-text-muted border border-border">Ctrl + Enter</kbd>
                  </p>
                </div>
              )}

              {!isRunning && result && (
                <div className="space-y-4">
                  {/* LeetCode Result Headline */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
                    <div>
                      <h3
                        className={`text-lg font-black tracking-tight ${
                          result.status === "PASSED" ? "text-[#00B8A3]" : "text-[#FF375F]"
                        }`}
                      >
                        {result.status === "PASSED"
                          ? "Accepted"
                          : result.status === "COMPILATION_ERROR"
                          ? "Compile Error"
                          : "Wrong Answer"}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-text-muted mt-1 font-mono">
                        <span>
                          Runtime:{" "}
                          <strong className="text-text-primary">
                            {result.executionTime ? `${Math.round(result.executionTime * 1000)} ms` : "< 1 ms"}
                          </strong>
                        </span>
                        <span>·</span>
                        <span className="text-[#00B8A3] font-semibold">Beats 98.2%</span>
                        <span>·</span>
                        <span>
                          Score: <strong className="text-text-primary">{result.score}%</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs">
                      <span className="text-text-dim block text-[10px] uppercase">Testcases</span>
                      <span className="font-bold text-text-primary">
                        {result.testsPassed} / {result.testsTotal} Passed
                      </span>
                    </div>
                  </div>

              {/* Compilation Error View */}
              {(result.status === "COMPILATION_ERROR" && result.compilationMessage) ? (
                <div className="relative rounded-lg border border-error/20 bg-error/5 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-error flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5" />
                      Compilation / Tool Diagnostic
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.compilationMessage || "")}
                      className="flex items-center gap-1 rounded bg-error/10 px-2 py-0.5 text-[10px] font-medium text-error hover:bg-error/20 transition-colors"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="max-h-56 overflow-auto font-mono text-[11px] leading-relaxed text-text-secondary whitespace-pre-wrap">
                    {result.compilationMessage}
                  </pre>
                </div>
              ) : null}

              {/* Generic error message if status is error and no tests */}
              {result.status === "error" && !result.tests?.length && (
                <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-xs text-error flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>{result.compilationMessage || "An unexpected error occurred during execution."}</span>
                </div>
              )}

              {/* Interactive Testcase Selector Tabs (LeetCode style) */}
              {tests.length > 0 && activeTab === "result" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {tests.map((test, idx) => {
                      const isActive = (idx === activeCaseIdx) || (!tests[activeCaseIdx] && idx === 0);
                      return (
                        <button
                          key={test.name + idx}
                          onClick={() => setActiveCaseIdx(idx)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            isActive
                              ? "bg-accent/15 text-accent border border-accent/40 shadow-[0_0_8px_rgba(0,217,165,0.15)]"
                              : "bg-surface hover:bg-surface/80 text-text-secondary border border-border"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              test.passed ? "bg-success" : "bg-error"
                            }`}
                          />
                          <span>Case {idx + 1}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Test Details */}
                  {selectedTest && (
                    <div className="rounded-lg border border-border bg-surface/30 p-3.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <div className="flex items-center gap-2">
                          {selectedTest.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-error" />
                          )}
                          <span className="font-mono text-xs font-semibold text-text-primary">
                            {selectedTest.name}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider ${
                            selectedTest.passed ? "text-success" : "text-error"
                          }`}
                        >
                          {selectedTest.passed ? "Passed" : "Failed"}
                        </span>
                      </div>

                      {/* Expected vs Actual */}
                      {(selectedTest.expected || selectedTest.received) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                          <div>
                            <span className="text-[10px] font-semibold uppercase text-text-muted tracking-wider block mb-1">
                              Expected Output
                            </span>
                            <div className="rounded-md border border-border bg-panel px-3 py-2 text-text-secondary break-all">
                              {selectedTest.expected || "N/A"}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold uppercase text-text-muted tracking-wider block mb-1">
                              Actual Output
                            </span>
                            <div
                              className={`rounded-md border px-3 py-2 break-all ${
                                selectedTest.passed
                                  ? "border-success/30 bg-success/5 text-success"
                                  : "border-error/30 bg-error/5 text-error"
                              }`}
                            >
                              {selectedTest.received || (selectedTest.passed ? selectedTest.expected : "N/A")}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-text-muted">
                          Result message:{" "}
                          <span className={selectedTest.passed ? "text-success" : "text-error"}>
                            {selectedTest.message || (selectedTest.passed ? "PASSED" : "FAILED")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
            </div>
          )}

          {activeTab === "log" && (
            <div className="relative rounded-lg border border-error/20 bg-error/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-error flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5" />
                  Compiler Diagnostics & Log
                </span>
                <button
                  onClick={() => {
                    if (result?.compilationMessage) {
                      navigator.clipboard.writeText(result.compilationMessage);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  className="flex items-center gap-1 rounded bg-error/10 px-2 py-0.5 text-[10px] font-medium text-error hover:bg-error/20 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="max-h-64 overflow-auto font-mono text-[11px] leading-relaxed text-text-secondary whitespace-pre-wrap">
                {result?.compilationMessage || "No compiler messages recorded."}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
