"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchMyRank } from "@/lib/api";
import {
  Code2,
  Trophy,
  Award,
  BookOpen,
  LayoutDashboard,
  LogIn,
  LogOut,
  UserPlus,
  Menu,
  X,
  ChevronRight,
  Flame,
  Cpu,
  Sparkles,
  Zap,
  Shield,
  MessageSquare,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
  { href: "/problems", label: "Problems", icon: Code2 },
  { href: "/contests", label: "Contests", icon: Trophy, badge: "NEW" },
  { href: "/leaderboard", label: "Leaderboard", icon: Award },
  { href: "/discuss", label: "Discuss", icon: MessageSquare },
  { href: "/learn", label: "Learn", icon: BookOpen },
];

function isActivePath(pathname: string, href: string): boolean {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 h-13 border-b border-border/80 bg-panel/85 backdrop-blur-xl transition-colors">
      <nav className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Main Navigation */}
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 text-accent transition-all duration-300 group-hover:scale-105 group-hover:border-accent/60 group-hover:shadow-[0_0_16px_rgba(0,217,165,0.35)]">
              <Cpu className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-12" />
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent animate-ping opacity-60" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-text-primary flex items-center gap-0.5">
                HDL<span className="text-accent">Forge</span>
                <span className="ml-1.5 rounded-full bg-surface px-1.5 py-0.2 text-[9px] font-mono font-semibold text-accent border border-accent/20">
                  RTL
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/problems"
                  ? pathname?.startsWith("/problems")
                  : pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-surface text-accent shadow-sm border border-accent/30"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface/60"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 transition-colors ${isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="rounded bg-accent/15 px-1 py-0.2 text-[8px] font-mono font-bold uppercase text-accent border border-accent/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="hidden items-center gap-2.5 md:flex">
          {/* Daily Streak Flame Pill (LeetCode Habit Loop) */}
          <Link
            href="/problems"
            className="flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-bold text-warning transition-all hover:bg-warning/20 hover:border-warning/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            title="Daily Hardware Challenge Streak"
          >
            <Flame className="h-3.5 w-3.5 text-warning animate-bounce" />
            <span className="font-mono">4 Days</span>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />

          {loading ? (
            <div className="h-7 w-7 animate-pulse rounded-lg bg-border" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {user.isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-xl border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-bold text-warning transition-all hover:bg-warning/20 hover:border-warning/60 shadow-sm"
                  title="Admin Portal"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </Link>
              )}
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary transition-all hover:border-accent/40 hover:text-accent hover:bg-surface/80"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>
              <div className="mx-1 h-4 w-px bg-border" />
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2.5 transition-all hover:bg-surface border border-transparent hover:border-border"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 text-xs font-bold text-accent">
                  {user.displayName?.[0] || user.username[0].toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-text-primary leading-tight">
                    {user.displayName || user.username}
                  </span>
                  <span className="text-[10px] font-mono text-accent font-medium leading-tight">
                    Lv. {user.level || 1}
                  </span>
                </div>
              </Link>
              <button
                onClick={() => logout()}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-all hover:bg-error/10 hover:text-error"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Login</span>
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-1.5 text-xs font-bold text-accent-fg transition-all hover:bg-accent-hover shadow-sm active:scale-95"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle & theme */}
        <div className="flex items-center gap-1.5 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center justify-center rounded-xl p-1.5 text-text-muted transition-all hover:bg-surface hover:text-text-primary"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-border bg-panel/95 backdrop-blur-2xl md:hidden px-4 py-3 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-dim">
              Navigation
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-warning font-mono">
              <Flame className="h-3.5 w-3.5" />
              <span>4 Days Streak</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </span>
                  {link.badge ? (
                    <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-mono text-accent">
                      {link.badge}
                    </span>
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-text-dim" />
                  )}
                </Link>
              );
            })}
          </div>

          {user?.isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold bg-warning/15 text-warning border border-warning/30"
            >
              <span className="flex items-center gap-2.5">
                <Shield className="h-4 w-4" />
                <span>Admin Portal</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-warning/70" />
            </Link>
          )}

          <div className="pt-2 border-t border-border/50">
            {user ? (
              <div className="flex items-center justify-between">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
                    {user.displayName?.[0] || user.username[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-text-primary">
                    {user.displayName || user.username}
                  </span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="rounded-lg p-1.5 text-error hover:bg-error/10 text-xs font-semibold"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1 rounded-xl border border-border bg-surface py-2 text-xs font-semibold text-text-primary"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1 rounded-xl bg-accent py-2 text-xs font-bold text-accent-fg shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
