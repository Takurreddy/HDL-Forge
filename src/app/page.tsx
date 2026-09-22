"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CircuitBoard from "@/components/CircuitBoard";
import TypingCodeHero from "@/components/TypingCodeHero";
import {
  Activity,
  ArrowRight,
  Terminal,
  Flame,
  Code2,
  Trophy,
  Building2,
  Boxes,
} from "lucide-react";

const capabilities = [
  {
    title: "Company Interview Questions",
    description:
      "Practice real hardware interview questions asked at NVIDIA, Apple, Intel, Qualcomm, AMD, and ARM. Master CDC, circular FIFOs, and FSM sequence detectors.",
    icon: Building2,
    badge: "Interview Prep",
  },
  {
    title: "Modular Chip Design & Parts",
    description:
      "Construct digital ICs by instantiating standard-cell parts. Interactive silicon architecture visualizer with pin maps and instant copy templates.",
    icon: Boxes,
    badge: "EDA Visualizer",
  },
  {
    title: "Daily Hardware Challenge",
    description:
      "Build consistent HDL mastery with a new curated problem every morning. Keep your streak alive and earn bonus XP on your path to senior VLSI engineer.",
    icon: Flame,
    badge: "Daily Streak",
  },
  {
    title: "Live Timed Contests",
    description:
      "Compete in 90-minute Weekly Hardware Sprints and Biweekly Silicon Cups. Ranked by testbench simulation pass rate, clock latency, and gate efficiency.",
    icon: Trophy,
    badge: "Global Rating",
  },
  {
    title: "Sandboxed RTL Execution",
    description:
      "Submit Verilog & SystemVerilog designs and execute them inside isolated, low-latency Docker sandboxes powered by Icarus Verilog and Verilator.",
    icon: Terminal,
    badge: "Zero Setup",
  },
  {
    title: "VCD Waveform Debugging",
    description:
      "Interactive digital timing diagrams rendered in your browser. Inspect transitions, clock edges, and signal busses cycle-by-cycle.",
    icon: Activity,
    badge: "Interactive",
  },
];

const topics = [
  "Combinational Gates",
  "Adders & ALUs",
  "Plexers & Decoders",
  "Sequential Latches & Flip-Flops",
  "Finite State Machines (FSM)",
  "Counters & Shift Registers",
  "Synchronous FIFOs",
  "AXI4-Lite & APB Protocols",
];

const COMPANY_LOGOS = [
  { name: "NVIDIA", color: "hover:text-[#76B900] hover:border-[#76B900]/40" },
  { name: "Apple Silicon", color: "hover:text-zinc-100 hover:border-zinc-400/40" },
  { name: "Intel", color: "hover:text-[#00A3FF] hover:border-[#0071C5]/40" },
  { name: "Qualcomm", color: "hover:text-[#6080FF] hover:border-[#3253DC]/40" },
  { name: "AMD", color: "hover:text-[#FF4A50] hover:border-[#ED1C24]/40" },
  { name: "Google Silicon", color: "hover:text-[#4285F4] hover:border-[#4285F4]/40" },
  { name: "ARM", color: "hover:text-[#00C2FF] hover:border-[#0091BD]/40" },
  { name: "Texas Instruments", color: "hover:text-[#CC0000] hover:border-[#CC0000]/40" },
  { name: "Broadcom", color: "hover:text-[#CC0000] hover:border-[#CC0000]/40" },
];

const METRICS = [
  { value: "100%", color: "text-accent", label: "Browser-Based Simulation" },
  { value: "Icarus & Verilator", color: "text-text-primary", label: "Industry Standard Engines" },
  { value: "VCD & GTKWave", color: "text-info", label: "True Signal Timing Analysis" },
  { value: "Zero Setup", color: "text-text-primary", label: "No Expensive EDA Licenses" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Code2,
    title: "Write RTL",
    desc: "Type Verilog or SystemVerilog your way. No line-by-line, letter-perfect matching pressure — your structure and style are up to you.",
    href: "/problems",
  },
  {
    step: "02",
    icon: Terminal,
    title: "Compile & Verify",
    desc: "Instant Docker sandbox runs iverilog & Verilator against hidden testbenches. Passing means correct behavior, never identical text.",
    href: "/problems/chip-adder-4bit",
  },
  {
    step: "03",
    icon: Activity,
    title: "Inspect Waveforms",
    desc: "VCD timing diagrams render right in the browser. Walk clock edges, busses, and signal transitions cycle-by-cycle.",
    href: "/problems/chip-adder-4bit",
  },
];

export default function HomePage() {
  const [nextContest, setNextContest] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    function tick() {
      const now = new Date();
      const target = new Date(now);
      const daysUntilSunday = (7 - target.getUTCDay()) % 7;
      target.setUTCDate(target.getUTCDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
      target.setUTCHours(18, 0, 0, 0);
      const diff = Math.max(0, target.getTime() - now.getTime());
      setNextContest({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden text-text-primary">
      {/* Animated Circuit Board Background Overlay */}
      <CircuitBoard />

      {/* Ambient Neon Glow Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[550px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-accent/15 via-info/10 to-transparent blur-[140px]" />
        <div className="absolute top-[800px] left-1/4 h-[400px] w-[600px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#00D9A5 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Hero Section */}
      <section className="relative px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          {/* Eyebrow Pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent shadow-[0_0_15px_rgba(0,217,165,0.15)]">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span>The LeetCode for Hardware, ECE &amp; EEE Engineers</span>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            Master Hardware Design.
            <br />
            <span className="gradient-accent-text">One RTL Problem at a Time.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base text-text-secondary sm:text-lg leading-relaxed">
            Practice Verilog &amp; SystemVerilog with instant sandboxed simulation, automated corner-case verification, browser-based waveform timing diagrams, and company interview tracks.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/problems"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-8 text-sm font-bold text-[#070707] transition-all hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(0,217,165,0.35)] transform hover:-translate-y-0.5 active:scale-95"
            >
              Start Practicing Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contests"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-panel/80 backdrop-blur-md px-6 text-sm font-semibold text-text-secondary transition-all hover:border-accent/40 hover:bg-surface hover:text-text-primary"
            >
              <Trophy className="h-4 w-4 text-warning" />
              Join Weekly Contest
            </Link>
          </div>

          {/* Animated Terminal / Code Demo (Typing → Compile → Waveform) */}
          <div className="mx-auto mt-12 w-full max-w-4xl">
            <TypingCodeHero />
          </div>

          {/* How it works — behavior-based, not copy-paste */}
          <div className="mx-auto mt-14 max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="text-xl font-bold sm:text-2xl text-text-primary">
                Learn by Building Chips, Not Copy-Pasting Code
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-xs text-text-muted">
                Solutions are graded on simulated behavior — names, spacing, and structure are completely your call.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step) => {
                const Icon = step.icon;
                return (
                  <Link
                    key={step.step}
                    href={step.href}
                    className="group rounded-2xl border border-border bg-panel p-6 text-left transition-all hover:border-accent/40 hover:shadow-[0_0_24px_rgba(0,217,165,0.08)]"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all group-hover:bg-accent/20 group-hover:shadow-[0_0_12px_rgba(0,217,165,0.2)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-text-dim">{step.step}</span>
                    </div>
                    <h3 className="mb-2 text-sm font-semibold text-text-primary transition-colors group-hover:text-accent">
                      {step.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-text-muted">{step.desc}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Target Hardware Companies Row (Rotating Marquee) */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4">
            <span className="text-[11px] font-mono uppercase tracking-widest text-text-dim">
              Preparing students for technical hardware interviews at
            </span>
            <div
              className="relative w-screen overflow-hidden"
              style={{
                marginLeft: "calc(50% - 50vw)",
                maskImage:
                  "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
              }}
            >
              <div className="flex w-max items-center gap-4 animate-[stats-marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
                {[...COMPANY_LOGOS, ...COMPANY_LOGOS].map((comp, idx) => (
                  <span
                    key={`${comp.name}-${idx}`}
                    className={`shrink-0 rounded-xl border border-border/80 bg-surface/60 px-4 py-2 text-sm font-semibold text-text-secondary transition-all cursor-default ${comp.color} hover:bg-surface`}
                  >
                    {comp.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Challenge & Weekly Contests Twin Cards */}
      <section className="px-4 py-8 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Daily Challenge Spotlight Card */}
          <div className="relative overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-panel to-surface p-6 shadow-xl group hover:border-accent transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-1.5 rounded-md bg-warning/15 px-2.5 py-1 text-xs font-mono font-bold text-warning border border-warning/30">
                <Flame className="h-3.5 w-3.5" />
                Problem of the Day
              </span>
              <span className="text-xs font-mono text-accent font-semibold">+50 Bonus XP</span>
            </div>

            <h3 className="text-base font-bold text-text-primary mb-1 group-hover:text-accent transition-colors">
              4-Bit Ripple Carry Adder Chip
            </h3>
            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Compose a 4-bit addition processor chip using standard cell full adder parts. Tested for corner cases and carry propagation.
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div className="flex items-center gap-2 text-[11px] font-mono text-text-dim">
                <span>Easy</span>
                <span>•</span>
                <span>Intel, AMD</span>
              </div>
              <Link
                href="/problems/chip-adder-4bit"
                className="flex items-center gap-1 text-xs font-bold text-accent group-hover:translate-x-1 transition-all"
              >
                <span>Solve Today</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Weekly Contest Spotlight Card */}
          <div className="relative overflow-hidden rounded-2xl border border-info/40 bg-gradient-to-br from-panel to-surface p-6 shadow-xl group hover:border-info transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-1.5 rounded-md bg-info/15 px-2.5 py-1 text-xs font-mono font-bold text-info border border-info/30">
                <Trophy className="h-3.5 w-3.5" />
                Weekly Hardware Sprint #42
              </span>
              <span className="text-xs font-mono text-text-dim">90 Minutes</span>
            </div>

            <h3 className="text-base font-bold text-text-primary mb-1 group-hover:text-info transition-colors">
              Live Digital VLSI Competition
            </h3>
            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Sponsored by NVIDIA Microarchitecture Team. 4 timed RTL questions ranging from multiplexer trees to pipelined ALUs.
            </p>

            <div className="mb-4 flex items-center gap-2 rounded-lg border border-info/20 bg-info/5 px-3 py-2">
              <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider text-info">
                {nextContest ? "Starts in" : "Live now"}
              </span>
              <span className="ml-auto font-mono text-xs font-bold tabular-nums text-text-primary">
                {nextContest
                  ? `${nextContest.d}d ${nextContest.h}h ${nextContest.m}m ${nextContest.s}s`
                  : "competing…"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-[11px] font-mono text-text-dim">
                Sunday 2:00 PM • Free
              </span>
              <Link
                href="/contests"
                className="flex items-center gap-1 text-xs font-bold text-info group-hover:translate-x-1 transition-all"
              >
                <span>View Contest Arena</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner (Rotating Marquee) */}
      <section className="relative overflow-hidden border-y border-border bg-panel/60 py-9 backdrop-blur-md">
        <div
          className="w-full overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
        >
          <div className="flex w-max items-center gap-16 animate-[stats-marquee_35s_linear_infinite] hover:[animation-play-state:paused]">
            {[...METRICS, ...METRICS].map((metric, idx) => (
              <div
                key={`${metric.label}-${idx}`}
                className="flex shrink-0 flex-col items-center text-center"
              >
                <div className={`text-2xl font-black whitespace-nowrap sm:text-4xl ${metric.color}`}>
                  {metric.value}
                </div>
                <div className="mt-1 text-xs text-text-muted whitespace-nowrap">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl text-text-primary">
              Built for Modern ECE &amp; EEE Engineers
            </h2>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              Everything required to ace semiconductor company technical interviews and master hardware microarchitecture.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="rounded-2xl border border-border bg-panel p-6 transition-all hover:border-accent/40 hover:shadow-[0_0_24px_rgba(0,217,165,0.08)] group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent/20 group-hover:shadow-[0_0_12px_rgba(0,217,165,0.2)] transition-all">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-semibold text-text-dim border border-border">
                      {cap.badge}
                    </span>
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {cap.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-text-muted">
                    {cap.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Topics Curriculum Pill Matrix */}
      <section className="border-t border-border bg-panel/40 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-3 text-xl font-bold sm:text-2xl text-text-primary">
            Comprehensive Digital Logic Curriculum
          </h2>
          <p className="text-xs text-text-muted max-w-md mx-auto mb-8">
            From basic Boolean gates to complex pipelined processors and industry-standard bus protocols.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {topics.map((t) => (
              <span
                key={t}
                className="rounded-xl border border-border bg-surface/80 px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-accent/40 hover:text-accent transition-all cursor-default"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-accent/30 bg-gradient-to-br from-panel via-surface to-[#0A1813] p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 h-64 w-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary mb-4">
            Ready to Ace Your Next Hardware Interview?
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto mb-8 leading-relaxed">
            Join thousands of electronics, electrical, and computer engineering students practicing RTL coding daily.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/problems"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-8 text-sm font-bold text-[#070707] transition-all hover:bg-accent-hover hover:shadow-[0_0_24px_rgba(0,217,165,0.4)] active:scale-95"
            >
              Start Practicing Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}