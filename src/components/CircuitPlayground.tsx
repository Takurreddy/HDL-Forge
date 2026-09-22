"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

type Gate = "AND" | "OR" | "XOR" | "NAND";

interface GateDef {
  id: Gate;
  label: string;
  op: string;
  compute: (a: boolean, b: boolean) => boolean;
  verilog: string;
}

const GATES: GateDef[] = [
  { id: "AND", label: "AND", op: "&", compute: (a, b) => a && b, verilog: "y = a & b;" },
  { id: "OR", label: "OR", op: "|", compute: (a, b) => a || b, verilog: "y = a | b;" },
  { id: "XOR", label: "XOR", op: "^", compute: (a, b) => a !== b, verilog: "y = a ^ b;" },
  { id: "NAND", label: "NAND", op: "~&", compute: (a, b) => !(a && b), verilog: "y = ~(a & b);" },
];

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-36 items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 px-3 py-2 transition-all hover:border-accent/30 hover:bg-surface"
    >
      <span className="text-xs font-medium text-text-secondary">In {label}</span>
      <span className="flex items-center gap-2">
        <span
          className={`relative h-5 w-9 rounded-full transition-colors ${
            on ? "bg-accent" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-on-accent transition-all ${
              on ? "left-[18px]" : "left-0.5"
            }`}
          />
        </span>
        <span
          className={`w-3 font-mono text-sm font-semibold transition-colors ${
            on ? "text-accent" : "text-text-muted"
          }`}
        >
          {on ? "1" : "0"}
        </span>
      </span>
    </button>
  );
}

function Wire({ on }: { on: boolean }) {
  return (
    <div className="h-1.5 w-12 overflow-hidden rounded-full border border-border/60 bg-surface/40 sm:w-16">
      <div
        className={`h-full rounded-full bg-accent transition-opacity duration-200 ${
          on ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export default function CircuitPlayground() {
  const [gateId, setGateId] = useState<Gate>("AND");
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);

  const gate = GATES.find((g) => g.id === gateId) ?? GATES[0];
  const out = gate.compute(a, b);

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-border bg-panel p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Zap className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">
            Live circuit playground
          </h3>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-surface/60 p-1">
          {GATES.map((g) => (
            <button
              key={g.id}
              onClick={() => setGateId(g.id)}
              className={`h-7 rounded-md px-3 text-xs font-semibold transition-colors ${
                g.id === gateId
                  ? "bg-accent text-on-accent"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <div className="flex w-full max-w-40 flex-col gap-2">
          <Toggle label="A" on={a} onClick={() => setA(!a)} />
          <Toggle label="B" on={b} onClick={() => setB(!b)} />
        </div>

        <div className="flex w-full max-w-72 items-center justify-center gap-3 sm:gap-4">
          <div className="flex flex-col gap-8">
            <Wire on={a} />
            <Wire on={b} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-xl border text-xl font-bold transition-all ${
                out
                  ? "border-accent/40 bg-accent/10 text-accent shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                  : "border-border bg-surface/40 text-text-muted"
              }`}
            >
              {gate.op}
            </div>
            <span className="whitespace-nowrap font-mono text-[10px] text-text-dim">
              {gate.verilog}
            </span>
          </div>
          <div className="flex items-center">
            <Wire on={out} />
          </div>
        </div>

        <div className="flex w-full max-w-40 items-center justify-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`h-12 w-12 rounded-full transition-all duration-200 ${
                out ? "bg-accent shadow-[0_0_24px_rgba(34,197,94,0.45)]" : "bg-border"
              }`}
            />
            <span className="font-mono text-sm font-semibold text-text-primary">
              y = {out ? 1 : 0}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-text-dim">Out</span>
          </div>
        </div>
      </div>
    </div>
  );
}