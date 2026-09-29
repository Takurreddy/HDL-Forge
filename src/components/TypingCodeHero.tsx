"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Loader, Zap, CheckCircle2, Waves } from "lucide-react";

const CODE = `module and_gate (
    input  a,
    input  b,
    output y
);
    assign y = a & b;
endmodule`;

const COMPILE_STEPS = [
  "Parsing Verilog tokens...",
  "Elaborating module hierarchy...",
  "Compiling synthesized netlist...",
  "Running simulation...",
];

const DEMO_A = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0];
const DEMO_B = [0, 1, 1, 0, 0, 1, 1, 0, 1, 1];
const DEMO_Y = DEMO_A.map((a, i) => (a && DEMO_B[i] ? 1 : 0));

const KEYWORD_RE =
  /(\/\/[^\n]*)|(\b(?:module|endmodule|input|output|wire|assign|logic|reg)\b)|(\b\d+(?:'[sbh]\w*)?\b)/g;

function highlight(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  KEYWORD_RE.lastIndex = 0;
  while ((m = KEYWORD_RE.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) {
      nodes.push(
        <span key={key++} className="font-normal italic text-text-dim">
          {m[1]}
        </span>
      );
    } else if (m[2]) {
      nodes.push(
        <span key={key++} className="font-semibold text-accent">
          {m[2]}
        </span>
      );
    } else if (m[3]) {
      nodes.push(
        <span key={key++} className="font-semibold text-warning">
          {m[3]}
        </span>
      );
    }
    last = KEYWORD_RE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Stage = "typing" | "compiling" | "ready";

function toPolyline(values: number[]): string {
  const width = 100;
  const n = values.length;
  const high = 5;
  const low = 15;
  const pts: string[] = [];
  values.forEach((v, i) => {
    const x1 = (i / n) * width;
    const x2 = ((i + 1) / n) * width;
    const y = v ? high : low;
    if (i === 0) pts.push(`${x1},${y}`);
    pts.push(`${x2},${y}`);
    if (i < n - 1) {
      const nextY = values[i + 1] ? high : low;
      pts.push(`${x2},${nextY}`);
    }
  });
  return pts.join(" ");
}

function WaveRow({
  label,
  values,
  colorClass,
  visible,
}: {
  label: string;
  values: number[];
  colorClass: string;
  visible: boolean;
}) {
  return (
    <div
      className={`flex h-8 items-center border-b border-border/30 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-30"
      }`}
    >
      <span
        className={`w-9 shrink-0 border-r border-border px-2 font-mono text-[10px] font-semibold ${colorClass}`}
      >
        {label}
      </span>
      <div className="relative h-full flex-1">
        <svg
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <polyline
            points={toPolyline(values)}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            className={colorClass}
          />
        </svg>
      </div>
    </div>
  );
}

function WaveformPane({ stage }: { stage: Stage }) {
  const compiling = stage === "compiling";
  const ready = stage === "ready";
  const rowsVisible = compiling || ready;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel">
      <div className="flex items-center justify-between border-b border-border bg-surface/40 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-error" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
          </div>
        <span className="font-mono text-xs text-text-muted">gate_wave.vcd</span>
        {compiling ? (
          <span className="flex items-center gap-1.5 rounded-md bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
            <span className="h-1 w-1 animate-pulse rounded-full bg-warning" />
            running
          </span>
        ) : ready ? (
          <span className="flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
            <span className="h-1 w-1 animate-pulse rounded-full bg-accent" />
            done
          </span>
        ) : (
          <span className="text-[10px] text-text-dim">idle</span>
        )}
      </div>

      {!rowsVisible ? (
        <div className="flex h-[140px] flex-col items-center justify-center gap-2">
          <Waves className="h-6 w-6 text-text-dim" />
          <p className="font-mono text-[11px] text-text-muted">
            No waveform yet
          </p>
          <p className="text-[10px] text-text-dim">
            Finish the code to run a simulation.
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center justify-between border-b border-border/30 px-2 py-1 font-mono text-[9px] text-text-dim">
            <span>ns</span>
            <span>2</span>
            <span>4</span>
            <span>6</span>
            <span>8</span>
            <span>10</span>
          </div>
          <WaveRow
            label="a"
            values={DEMO_A}
            colorClass="text-info"
            visible={rowsVisible}
          />
          <WaveRow
            label="b"
            values={DEMO_B}
            colorClass="text-warning"
            visible={rowsVisible}
          />
          <WaveRow
            label="y"
            values={DEMO_Y}
            colorClass="text-accent"
            visible={rowsVisible}
          />
          {compiling && (
            <div className="pointer-events-none absolute inset-y-0 w-px animate-[wave-scan_1.4s_linear_infinite] bg-warning" />
          )}
        </div>
      )}
    </div>
  );
}

export default function TypingCodeHero() {
  const [stage, setStage] = useState<Stage>("typing");
  const [count, setCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (stage === "typing" && count < CODE.length) {
        setCount((c) => c + 1);
      } else if (stage === "typing" && count >= CODE.length) {
        setStage("compiling");
      } else if (stage === "ready") {
        setStage("typing");
        setCount(0);
        setProgress(0);
      }
    }, stage === "ready" ? 4200 : 34);
    return () => clearTimeout(timeout);
  }, [stage, count]);

  useEffect(() => {
    if (stage !== "compiling") return;
    const duration = 2400;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setStage("ready");
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [stage]);

  const stepIndex = Math.min(
    COMPILE_STEPS.length - 1,
    Math.floor(progress * COMPILE_STEPS.length)
  );
  const typing = stage === "typing";
  const compiling = stage === "compiling";
  const ready = stage === "ready";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="overflow-hidden rounded-xl border border-border bg-panel text-left">
        <div className="flex items-center justify-between border-b border-border bg-surface/40 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-error" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
          </div>
          <span className="font-mono text-xs text-text-muted">and_gate.sv</span>
          {compiling ? (
            <span className="flex items-center gap-1.5 rounded-md bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
              <span className="h-1 w-1 animate-pulse rounded-full bg-warning" />
              compiling...
            </span>
          ) : ready ? (
            <span className="flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
              <span className="h-1 w-1 animate-pulse rounded-full bg-accent" />
              ready
            </span>
          ) : (
            <span className="text-[10px] text-text-dim">editing...</span>
          )}
        </div>

        <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-text-primary sm:text-sm">
          {highlight(CODE.slice(0, count))}
          {typing && <span className="ml-0.5 animate-pulse text-accent">▍</span>}
        </pre>

        {compiling && (
          <div className="border-t border-border bg-surface/30 px-4 py-3">
            <p className="mb-2 flex items-center gap-2 font-mono text-[11px] text-text-muted">
              {stepIndex < COMPILE_STEPS.length - 1 ? (
                <Loader className="h-3 w-3 animate-spin text-warning" />
              ) : (
                <Zap className="h-3 w-3 text-warning" />
              )}
              {COMPILE_STEPS[stepIndex]}
            </p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full transition-[width] duration-100 gradient-accent"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {ready && (
          <div className="border-t border-border bg-accent/5 px-4 py-3">
            <p className="flex items-center gap-2 font-mono text-[11px] text-accent">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Compilation successful — 10/10 test cases passed
            </p>
          </div>
        )}
      </div>

      <WaveformPane stage={stage} />
    </div>
  );
}