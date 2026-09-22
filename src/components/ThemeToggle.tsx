"use client";

import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 w-8 rounded-xl border border-border/60 bg-surface/50" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-border/80 bg-surface/80 text-text-secondary transition-all duration-300 hover:border-accent/40 hover:text-accent hover:bg-surface hover:shadow-[0_0_12px_rgba(0,217,165,0.15)] active:scale-95"
      title={isDark ? "Switch to Clean Light Mode" : "Switch to Cyber Dark Mode"}
      aria-label="Toggle theme"
    >
      <div className="relative h-4 w-4">
        <Sun
          className={`absolute inset-0 h-4 w-4 transition-all duration-300 transform ${
            isDark
              ? "rotate-90 scale-0 opacity-0 text-amber-400"
              : "rotate-0 scale-100 opacity-100 text-amber-500"
          }`}
        />
        <Moon
          className={`absolute inset-0 h-4 w-4 transition-all duration-300 transform ${
            isDark
              ? "rotate-0 scale-100 opacity-100 text-accent"
              : "-rotate-90 scale-0 opacity-0 text-text-muted"
          }`}
        />
      </div>
    </button>
  );
}
