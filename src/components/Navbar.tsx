"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
  Menu,
  X,
  ChevronRight,
  MessageSquare,
  BarChart3,
  Flame,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
  { href: "/problems", label: "Problems", icon: Code2 },
  { href: "/contests", label: "Contests", icon: Trophy, badge: "NEW" },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { href: "/discuss", label: "Discussion", icon: MessageSquare },
  { href: "/achievements", label: "Achievements", icon: Award },
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

  useEffect(() => {
    if (!user) {
      setStreak(null);
      return;
    }
    let cancelled = false;
    fetchMyRank()
      .then((rank) => {
        if (!cancelled) setStreak(rank.streak);
      })
      .catch(() => {
        if (!cancelled) setStreak(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const linkClasses = (href: string) =>
    `flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
      isActivePath(pathname, href)
        ? "text-accent"
        : "text-text-muted hover:bg-surface/60 hover:text-text-primary"
    }`;

  return (
    <header className="sticky top-0 z-50 h-12 border-b border-border bg-panel/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent transition-all group-hover:bg-accent/20">
              <Code2 className="h-4 w-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-text-primary">
              HDL<span className="text-accent">Forge</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className={linkClasses(link.href)}>
                  <Icon className="h-4 w-4" />
                  {link.label}
                  {link.badge && (
                    <span className="rounded bg-accent/15 px-1 py-0.5 text-[8px] font-mono font-bold uppercase text-accent">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          {!loading && (user ? streak : 4) !== null && (
            <div
              className="flex h-7 items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/10 px-2 font-mono text-xs font-bold tabular-nums text-warning"
              title="Daily streak"
            >
              <Flame className="h-4 w-4 fill-current" />
              {user ? streak : 4}d
            </div>
          )}
          {loading ? (
            <div className="h-7 w-7 animate-pulse rounded-lg bg-border" />
          ) : user ? (
            <div className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface/60 hover:text-text-primary"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="mx-1 h-4 w-px bg-border" />
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-surface/60"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
                  {user.displayName?.[0] || user.username[0].toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate text-sm font-medium text-text-secondary">
                  {user.displayName || user.username}
                </span>
              </Link>
              <button
                onClick={() => logout()}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
              >
                <LogIn className="h-4 w-4" />
                SignIn/Up
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface/60 hover:text-text-primary"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border bg-panel lg:hidden">
          <div className="flex flex-col gap-0.5 px-2 py-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActivePath(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "text-accent"
                      : "text-text-secondary hover:bg-surface/60 hover:text-text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {link.label}
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
            {user ? (
              <>
                <div className="my-1 h-px bg-border" />
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface/60 hover:text-text-primary"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-error/70 transition-colors hover:bg-error/10 hover:text-error"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="my-1 h-px bg-border" />
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-center text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
                >
                  <LogIn className="h-4 w-4" />
                  SignIn/Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}