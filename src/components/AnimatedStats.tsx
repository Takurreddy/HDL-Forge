"use client";

import { useEffect, useRef, useState } from "react";
import { fetchProblems } from "@/lib/api";

const FALLBACK_COUNT = 500;

export default function AnimatedStats() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [problemCount, setProblemCount] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchProblems()
      .then((data) => {
        if (!cancelled) setProblemCount(data.total);
      })
      .catch(() => {
        // Backend unreachable — fall back to the placeholder count
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const target = problemCount ?? FALLBACK_COUNT;
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayCount(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, problemCount]);

  const stats = [
    { value: `${displayCount.toLocaleString()}+`, label: "HDL Problems" },
    { value: "Verilog", label: "Verilog Support" },
    { value: "SystemVerilog", label: "SystemVerilog" },
    { value: "RTL", label: "RTL Focused" },
  ];

  return (
    <div
      ref={rootRef}
      className="group relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
    >
      <div className="flex w-max animate-[stats-marquee_28s_linear_infinite] group-hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex" aria-hidden={copy === 1}>
            {stats.map((stat) => (
              <div
                key={`${copy}-${stat.label}`}
                className="flex flex-none items-center gap-10 px-10 sm:gap-14 sm:px-14"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-text-muted">{stat.label}</div>
                </div>
                <div
                  aria-hidden
                  className="h-8 w-px rounded-full bg-border"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}