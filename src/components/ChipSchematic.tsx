"use client";

import React, { useState } from "react";
import {
  Cpu,
  Layers,
  Copy,
  Check,
  Zap,
  Info,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Boxes,
} from "lucide-react";
import { Problem } from "@/lib/types";

interface ChipPart {
  name: string;
  category: string;
  description: string;
  inputs: string[];
  outputs: string[];
  template: string;
}

interface ChipBlock {
  id: string;
  name: string;
  type: string;
  label: string;
  inputs: { name: string; connectedTo: string }[];
  outputs: { name: string; connectedTo: string }[];
}

interface ChipPin {
  pin: number;
  name: string;
  direction: "input" | "output";
  width: string;
  description: string;
}

interface ChipSchematicProps {
  problem: Problem;
}

export default function ChipSchematic({ problem }: ChipSchematicProps) {
  const [copiedPart, setCopiedPart] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  // Dynamic schematic configuration based on problem slug
  const isAdder = problem.slug.includes("adder") || problem.slug.includes("alu");
  const isMux = problem.slug.includes("mux");
  const isFifo = problem.slug.includes("fifo");

  // Parts library for this chip problem
  const parts: ChipPart[] = isMux
    ? [
        {
          name: "mux2",
          category: "Multiplexer Cell",
          description: "2-to-1 data multiplexer standard cell. Selects d0 when sel=0, d1 when sel=1.",
          inputs: ["d0", "d1", "sel"],
          outputs: ["y"],
          template: "mux2 u_mux (\n  .d0(in0),\n  .d1(in1),\n  .sel(sel_bit),\n  .y(out_wire)\n);",
        },
      ]
    : isFifo
    ? [
        {
          name: "dpram_cell",
          category: "Storage Array Part",
          description: "Dual-port synchronous RAM cell. Dual address pointers with write enable.",
          inputs: ["clk", "we", "waddr[3:0]", "wdata[7:0]", "raddr[3:0]"],
          outputs: ["rdata[7:0]"],
          template: "dpram_cell u_ram (\n  .clk(clk),\n  .we(wr_en),\n  .waddr(wr_ptr),\n  .wdata(data_in),\n  .raddr(rd_ptr),\n  .rdata(data_out)\n);",
        },
      ]
    : [
        {
          name: "full_adder",
          category: "Arithmetic Standard Cell",
          description: "1-bit full adder primitive. Computes sum = a ^ b ^ cin and carry out.",
          inputs: ["a", "b", "cin"],
          outputs: ["sum", "cout"],
          template: "full_adder fa0 (\n  .a(a[0]),\n  .b(b[0]),\n  .cin(cin),\n  .sum(sum[0]),\n  .cout(c1)\n);",
        },
      ];

  // External package pins
  const pins: ChipPin[] = isMux
    ? [
        { pin: 1, name: "d[3:0]", direction: "input", width: "[3:0]", description: "4-bit parallel data inputs (d0, d1, d2, d3)" },
        { pin: 2, name: "sel[1:0]", direction: "input", width: "[1:0]", description: "2-bit selection address code" },
        { pin: 3, name: "y", direction: "output", width: "1-bit", description: "Selected single-bit output stream" },
      ]
    : isFifo
    ? [
        { pin: 1, name: "clk", direction: "input", width: "1-bit", description: "Primary master clock" },
        { pin: 2, name: "rst_n", direction: "input", width: "1-bit", description: "Active-low asynchronous system reset" },
        { pin: 3, name: "wr_en", direction: "input", width: "1-bit", description: "Write push strobe" },
        { pin: 4, name: "data_in[7:0]", direction: "input", width: "[7:0]", description: "Incoming 8-bit byte stream" },
        { pin: 5, name: "rd_en", direction: "input", width: "1-bit", description: "Read pop strobe" },
        { pin: 6, name: "data_out[7:0]", direction: "output", width: "[7:0]", description: "Outgoing 8-bit byte stream" },
        { pin: 7, name: "full", direction: "output", width: "1-bit", description: "FIFO overflow boundary flag" },
        { pin: 8, name: "empty", direction: "output", width: "1-bit", description: "FIFO underflow empty flag" },
      ]
    : [
        { pin: 1, name: "a[3:0]", direction: "input", width: "[3:0]", description: "4-bit Augend vector operand" },
        { pin: 2, name: "b[3:0]", direction: "input", width: "[3:0]", description: "4-bit Addend vector operand" },
        { pin: 3, name: "cin", direction: "input", width: "1-bit", description: "Initial carry input into stage 0" },
        { pin: 4, name: "sum[3:0]", direction: "output", width: "[3:0]", description: "4-bit addition result sum bus" },
        { pin: 5, name: "cout", direction: "output", width: "1-bit", description: "Final carry overflow output from stage 3" },
      ];

  // Internal blocks
  const blocks: ChipBlock[] = isMux
    ? [
        {
          id: "m0",
          name: "m0",
          type: "mux2",
          label: "Stage 0: Lower 2:1",
          inputs: [
            { name: "d0", connectedTo: "d[0]" },
            { name: "d1", connectedTo: "d[1]" },
            { name: "sel", connectedTo: "sel[0]" },
          ],
          outputs: [{ name: "y", connectedTo: "w_low" }],
        },
        {
          id: "m1",
          name: "m1",
          type: "mux2",
          label: "Stage 0: Upper 2:1",
          inputs: [
            { name: "d0", connectedTo: "d[2]" },
            { name: "d1", connectedTo: "d[3]" },
            { name: "sel", connectedTo: "sel[0]" },
          ],
          outputs: [{ name: "y", connectedTo: "w_high" }],
        },
        {
          id: "m2",
          name: "m2",
          type: "mux2",
          label: "Stage 1: Output 2:1",
          inputs: [
            { name: "d0", connectedTo: "w_low" },
            { name: "d1", connectedTo: "w_high" },
            { name: "sel", connectedTo: "sel[1]" },
          ],
          outputs: [{ name: "y", connectedTo: "y (Pin)" }],
        },
      ]
    : [
        {
          id: "fa0",
          name: "fa0",
          type: "full_adder",
          label: "Bit 0 [LSB]",
          inputs: [
            { name: "a", connectedTo: "a[0]" },
            { name: "b", connectedTo: "b[0]" },
            { name: "cin", connectedTo: "cin" },
          ],
          outputs: [
            { name: "sum", connectedTo: "sum[0]" },
            { name: "cout", connectedTo: "wire c1" },
          ],
        },
        {
          id: "fa1",
          name: "fa1",
          type: "full_adder",
          label: "Bit 1",
          inputs: [
            { name: "a", connectedTo: "a[1]" },
            { name: "b", connectedTo: "b[1]" },
            { name: "cin", connectedTo: "wire c1" },
          ],
          outputs: [
            { name: "sum", connectedTo: "sum[1]" },
            { name: "cout", connectedTo: "wire c2" },
          ],
        },
        {
          id: "fa2",
          name: "fa2",
          type: "full_adder",
          label: "Bit 2",
          inputs: [
            { name: "a", connectedTo: "a[2]" },
            { name: "b", connectedTo: "b[2]" },
            { name: "cin", connectedTo: "wire c2" },
          ],
          outputs: [
            { name: "sum", connectedTo: "sum[2]" },
            { name: "cout", connectedTo: "wire c3" },
          ],
        },
        {
          id: "fa3",
          name: "fa3",
          type: "full_adder",
          label: "Bit 3 [MSB]",
          inputs: [
            { name: "a", connectedTo: "a[3]" },
            { name: "b", connectedTo: "b[3]" },
            { name: "cin", connectedTo: "wire c3" },
          ],
          outputs: [
            { name: "sum", connectedTo: "sum[3]" },
            { name: "cout", connectedTo: "cout (Pin)" },
          ],
        },
      ];

  const handleCopy = (part: ChipPart) => {
    void navigator.clipboard.writeText(part.template);
    setCopiedPart(part.name);
    setTimeout(() => setCopiedPart(null), 2000);
  };

  const inputPins = pins.filter((p) => p.direction === "input");
  const outputPins = pins.filter((p) => p.direction === "output");

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-accent/30 bg-surface/40 p-4 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 border border-accent/30 text-accent shadow-[0_0_15px_rgba(0,217,165,0.2)]">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-primary">
                  Structural Chip Architecture & Parts Library
                </h3>
                <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-accent border border-accent/30">
                  Standard Cell Design
                </span>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Compose this IC package by instantiating modular standard cells. Click any block to inspect pin mappings or copy instance templates below.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual EDA Chip Package Diagram */}
      <div className="rounded-xl border border-border bg-editor p-5 shadow-2xl relative overflow-hidden">
        {/* Silicon Wafer Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
              Silicon IC Package: {problem.slug.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-text-dim">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Active Netlist
            </span>
            <span className="text-border">|</span>
            <span>Technology: 7nm Standard Cell</span>
          </div>
        </div>

        {/* The IC Package Layout */}
        <div className="grid grid-cols-12 gap-3 items-center min-h-[320px]">
          {/* External Left Pins (Inputs) */}
          <div className="col-span-3 space-y-2.5">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-dim px-1">
              External Inputs
            </div>
            {inputPins.map((pin) => (
              <div
                key={pin.pin}
                className="group relative flex items-center justify-between rounded-lg border border-border/80 bg-surface/70 px-2.5 py-2 hover:border-accent/50 hover:bg-surface transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-panel px-1.5 py-0.5 text-[9px] font-mono font-bold text-text-dim border border-border">
                    P{pin.pin}
                  </span>
                  <div>
                    <span className="text-xs font-mono font-bold text-text-primary">
                      {pin.name}
                    </span>
                    <span className="block text-[9px] text-text-dim font-mono">
                      {pin.width}
                    </span>
                  </div>
                </div>

                {/* Pad Terminal Connector */}
                <div className="h-2 w-2 rounded-full bg-accent/60 group-hover:bg-accent group-hover:shadow-[0_0_8px_#00d9a5] transition-all" />
              </div>
            ))}
          </div>

          {/* Central Silicon Die Boundary */}
          <div className="col-span-6 rounded-2xl border-2 border-border/90 bg-panel/90 p-4 relative shadow-inner">
            <div className="absolute top-2 left-3 flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-accent/80 font-bold">
              <Boxes className="h-3 w-3" />
              <span>Core Silicon Die Substrate</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {blocks.map((block) => {
                const isSelected = selectedBlock === block.id;
                return (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlock(isSelected ? null : block.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(0,217,165,0.2)]"
                        : "border-border/80 bg-surface/40 hover:border-accent/40 hover:bg-surface/70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-accent">
                        {block.name}
                      </span>
                      <span className="rounded bg-panel px-1.5 py-0.5 text-[9px] font-mono text-text-dim border border-border">
                        {block.type}
                      </span>
                    </div>

                    <div className="text-[10px] font-medium text-text-secondary mb-2.5">
                      {block.label}
                    </div>

                    {/* Inputs to this block */}
                    <div className="space-y-1 border-t border-border/50 pt-2 text-[10px] font-mono">
                      <div className="text-[8px] uppercase tracking-wider text-text-dim">
                        Ports Mapping
                      </div>
                      {block.inputs.map((inp) => (
                        <div key={inp.name} className="flex items-center justify-between text-text-muted">
                          <span className="text-text-dim">.{inp.name}:</span>
                          <span className="font-semibold text-text-secondary truncate max-w-[80px]">
                            {inp.connectedTo}
                          </span>
                        </div>
                      ))}
                      {block.outputs.map((out) => (
                        <div key={out.name} className="flex items-center justify-between text-accent font-semibold">
                          <span>.{out.name}:</span>
                          <span className="truncate max-w-[80px]">{out.connectedTo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Carry/Signal Flow Indicator at bottom */}
            {isAdder && (
              <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-surface/50 border border-border/50 px-2 py-1 text-[10px] font-mono text-text-muted">
                <span>Carry Chain:</span>
                <span className="text-accent font-semibold">cin</span>
                <ArrowRight className="h-3 w-3 text-text-dim" />
                <span className="text-warning font-semibold">c1</span>
                <ArrowRight className="h-3 w-3 text-text-dim" />
                <span className="text-warning font-semibold">c2</span>
                <ArrowRight className="h-3 w-3 text-text-dim" />
                <span className="text-warning font-semibold">c3</span>
                <ArrowRight className="h-3 w-3 text-text-dim" />
                <span className="text-accent font-semibold">cout</span>
              </div>
            )}
          </div>

          {/* External Right Pins (Outputs) */}
          <div className="col-span-3 space-y-2.5">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-dim px-1 text-right">
              External Outputs
            </div>
            {outputPins.map((pin) => (
              <div
                key={pin.pin}
                className="group relative flex items-center justify-between rounded-lg border border-border/80 bg-surface/70 px-2.5 py-2 hover:border-accent/50 hover:bg-surface transition-all"
              >
                {/* Pad Terminal Connector */}
                <div className="h-2 w-2 rounded-full bg-accent/60 group-hover:bg-accent group-hover:shadow-[0_0_8px_#00d9a5] transition-all" />

                <div className="flex items-center gap-2 text-right">
                  <div>
                    <span className="text-xs font-mono font-bold text-text-primary">
                      {pin.name}
                    </span>
                    <span className="block text-[9px] text-text-dim font-mono">
                      {pin.width}
                    </span>
                  </div>
                  <span className="rounded bg-panel px-1.5 py-0.5 text-[9px] font-mono font-bold text-text-dim border border-border">
                    P{pin.pin}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Available Parts Toolbox */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Standard Cells & Provided Parts Library
            </h4>
          </div>
          <span className="text-[11px] text-text-dim font-mono">
            {parts.length} cell(s) pre-compiled in simulator
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {parts.map((part) => (
            <div
              key={part.name}
              className="rounded-xl border border-border bg-panel p-4 transition-all hover:border-border/80 shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface border border-border text-accent">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-mono font-bold text-text-primary">
                      {part.name}
                    </span>
                    <span className="ml-2 rounded bg-surface px-2 py-0.5 text-[10px] font-mono text-text-dim border border-border">
                      {part.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(part)}
                  className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent/20 active:scale-95"
                >
                  {copiedPart === part.name ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" />
                      <span className="text-success">Copied Template!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Instantiation</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-text-muted mb-3 font-sans leading-relaxed">
                {part.description}
              </p>

              {/* Ports spec chips */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] font-mono uppercase text-text-dim">Inputs:</span>
                {part.inputs.map((inp) => (
                  <span
                    key={inp}
                    className="rounded bg-surface px-2 py-0.5 text-[10px] font-mono text-text-secondary border border-border"
                  >
                    {inp}
                  </span>
                ))}
                <span className="ml-2 text-[10px] font-mono uppercase text-text-dim">Outputs:</span>
                {part.outputs.map((out) => (
                  <span
                    key={out}
                    className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-mono text-accent border border-accent/30"
                  >
                    {out}
                  </span>
                ))}
              </div>

              {/* Code snippet preview */}
              <div className="rounded-lg bg-editor border border-border/80 p-3 font-mono text-xs text-text-secondary overflow-x-auto">
                <pre className="text-[11px] leading-relaxed text-text-primary font-mono">
                  {part.template}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
