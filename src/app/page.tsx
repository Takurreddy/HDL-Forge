import Link from "next/link";
import TypingCodeHero from "@/components/TypingCodeHero";
import AnimatedStats from "@/components/AnimatedStats";
import CircuitBoard from "@/components/CircuitBoard";
import { Code2, CheckCircle2, Activity, Sparkles, ArrowRight, ChevronRight } from "lucide-react";

const capabilities = [
  {
    title: "RTL Practice",
    description: "Solve hardware-design problems directly in the browser with SystemVerilog syntax support.",
    icon: Code2,
  },
  {
    title: "Automated Verification",
    description: "Run your RTL against hidden testbenches and receive instant feedback on correctness.",
    icon: CheckCircle2,
  },
  {
    title: "Waveform Debugging",
    description: "Understand hardware behavior through simulation waveforms and signal analysis.",
    icon: Activity,
  },
  {
    title: "AI Hardware Tutor",
    description: "Get HDL-specific explanations and debugging assistance powered by AI.",
    icon: Sparkles,
  },
];

export default function HomePage() {
  return (
    <div className="relative">
      {/* Circuit board overlay */}
      <CircuitBoard />

      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Hero */}
      <section className="relative px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-1.5 text-[11px] text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Open Beta — Start practicing today
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
            HDL<span className="text-accent">Forge</span>
          </h1>

          <p className="mb-4 text-2xl font-semibold sm:text-3xl">
            Master Hardware Design.
            <br />
            <span className="text-text-secondary">One RTL problem at a time.</span>
          </p>

          <p className="mx-auto mb-10 max-w-2xl text-base text-text-muted sm:text-lg">
            Practice Verilog and SystemVerilog through real RTL design problems,
            simulation, verification, and hardware-focused feedback.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/problems"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent transition-all hover:bg-accent-hover hover:shadow-[0_0_24px_rgba(34,197,94,0.3)]"
            >
              Start Practicing
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/problems"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-panel px-6 text-sm font-medium text-text-secondary transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-text-primary"
            >
              Explore Problems
            </Link>
          </div>

          <div className="mx-auto mt-10 w-full max-w-4xl">
            <TypingCodeHero />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative border-y border-border bg-panel/50 px-4 py-12 sm:px-6 lg:px-8">
        <AnimatedStats />
      </section>

      {/* Capabilities */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl">Everything you need to master RTL design</h2>
            <p className="text-sm text-text-muted">A complete platform for hardware engineers to practice, learn, and grow.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="rounded-xl border border-border bg-panel p-6 transition-all hover:border-accent/20 hover:shadow-[0_0_20px_rgba(34,197,94,0.05)]"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-text-primary">{cap.title}</h3>
                  <p className="text-xs leading-relaxed text-text-muted">{cap.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-bold">Ready to start building hardware?</h2>
          <p className="mb-8 text-sm text-text-muted">Jump into your first problem and start writing SystemVerilog today.</p>
          <Link
            href="/problems/and-gate"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-8 text-sm font-semibold text-on-accent transition-all hover:bg-accent-hover hover:shadow-[0_0_24px_rgba(34,197,94,0.3)]"
          >
            Solve Your First Problem
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-xs text-text-dim">
          <span>
            HDL<span className="text-accent">Forge</span>
          </span>
          <span>Phase 1 — Frontend MVP</span>
        </div>
      </footer>
    </div>
  );
}
