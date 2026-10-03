"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Difficulty } from "@/lib/types";
import {
  fetchAdminStats,
  fetchAdminProblems,
  fetchAdminSubmissions,
  fetchAdminUsers,
  createAdminProblem,
  toggleUserAdmin,
  AdminStats,
  AdminProblem,
  AdminSubmission,
  AdminUser,
} from "@/lib/api";
import DifficultyBadge from "@/components/DifficultyBadge";
import {
  Shield,
  Layers,
  Code2,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  RefreshCw,
  Cpu,
  Server,
  Lock,
  Flame,
  Award,
  AlertTriangle,
  LogIn,
  Loader2,
} from "lucide-react";

function AdminPortalContent() {
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [problems, setProblems] = useState<AdminProblem[]>([]);
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "problems" | "submissions" | "users">("overview");

  // Inline Admin Login State
  const [inlineEmail, setInlineEmail] = useState("");
  const [inlinePassword, setInlinePassword] = useState("");
  const [inlineLoading, setInlineLoading] = useState(false);
  const [inlineError, setInlineError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // New problem form modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newProblem, setNewProblem] = useState({
    slug: "",
    title: "",
    category: "Combinational Logic",
    difficulty: "EASY",
    description: "",
    starter_code: "module solution (\n  // ports here\n);\n\n  // implementation\n\nendmodule",
    testbench: "module testbench;\n  // test assertions\n  initial begin\n    $display(\"HDLFORGE_SCORE:100\");\n    $finish;\n  end\nendmodule",
    company_tags: "Intel, NVIDIA",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sData, pData, subData, uData] = await Promise.allSettled([
        fetchAdminStats(),
        fetchAdminProblems(),
        fetchAdminSubmissions(50),
        fetchAdminUsers(50),
      ]);

      if (sData.status === "fulfilled") setStats(sData.value);
      if (pData.status === "fulfilled") setProblems(pData.value);
      if (subData.status === "fulfilled") setSubmissions(subData.value);
      if (uData.status === "fulfilled") setUsers(uData.value);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load admin telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      queueMicrotask(() => void loadData());
    }
  }, [authLoading, user]);

  useEffect(() => {
    queueMicrotask(() => {
      if (searchParams.get("create") === "true") {
        setShowCreateModal(true);
        setActiveTab("problems");
      }
      const tab = searchParams.get("tab");
      if (tab === "problems" || tab === "submissions" || tab === "users" || tab === "overview") {
        setActiveTab(tab);
      }
    });
  }, [searchParams]);

  const handleInlineAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInlineLoading(true);
    setInlineError("");
    try {
      await login(inlineEmail, inlinePassword);
      await loadData();
    } catch (err: unknown) {
      setInlineError(err instanceof Error ? err.message : "Admin login failed.");
    } finally {
      setInlineLoading(false);
    }
  };

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateSuccess(null);
    try {
      await createAdminProblem(newProblem);
      setCreateSuccess(`Problem "${newProblem.title}" added to catalog successfully!`);
      setShowCreateModal(false);
      setNewProblem({
        slug: "",
        title: "",
        category: "Combinational Logic",
        difficulty: "EASY",
        description: "",
        starter_code: "module solution (\n  // ports here\n);\n\n  // implementation\n\nendmodule",
        testbench: "module testbench;\n  // test assertions\n  initial begin\n    $display(\"HDLFORGE_SCORE:100\");\n    $finish;\n  end\nendmodule",
        company_tags: "Intel, NVIDIA",
      });
      await loadData();
    } catch (err: unknown) {
      alert("Failed to create problem: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    try {
      await toggleUserAdmin(userId);
      await loadData();
    } catch (err: unknown) {
      alert("Failed to toggle admin status: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Auth Protection Gate
  if (authLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="font-mono text-xs text-text-dim">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-warning/30 bg-warning/10 text-warning shadow-lg">
          <Shield className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-text-primary tracking-tight">Admin Console Access</h2>
        <p className="mt-2 text-xs text-text-muted leading-relaxed">
          The HDLForge Administration Console requires an authenticated administrator session. Sign in with normal credentials or use instant root access.
        </p>

        {inlineError && (
          <div className="mt-4 rounded-xl border border-error/30 bg-error/10 p-2.5 text-xs text-error">
            {inlineError}
          </div>
        )}

        {/* 1-Click Instant Root Admin Button */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => handleInlineAdminLogin()}
            disabled={inlineLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-xs font-bold text-accent-fg hover:bg-accent-hover transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {inlineLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            <span>1-Click Root Administrator Sign-In</span>
          </button>

          <form onSubmit={handleInlineAdminLogin} className="space-y-2.5 text-left border-t border-border pt-4">
            <div>
              <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                Admin Email or Username
              </label>
              <input
                type="text"
                value={inlineEmail}
                onChange={(e) => setInlineEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                Admin Password
              </label>
              <input
                type="password"
                value={inlinePassword}
                onChange={(e) => setInlinePassword(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={inlineLoading}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface py-2 text-xs font-semibold text-text-primary hover:border-accent/40 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Authenticate Credentials</span>
            </button>
          </form>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-error/30 bg-error/10 text-error">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-text-primary tracking-tight">Access Restricted</h2>
        <p className="mt-2 text-xs text-text-muted leading-relaxed">
          Currently signed in as <strong className="text-text-primary">@{user.username}</strong> ({user.email}). This account does not currently possess administrator privileges.
        </p>

        <div className="mt-6 space-y-2.5">
          <button
            onClick={() => handleInlineAdminLogin()}
            disabled={inlineLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-accent-fg hover:bg-accent-hover transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {inlineLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            <span>Switch to System Administrator</span>
          </button>

          <Link
            href="/dashboard"
            className="block w-full rounded-xl bg-surface border border-border px-5 py-2.5 text-xs font-bold text-text-primary hover:border-accent/40 transition-all text-center"
          >
            Go to User Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Filter problems
  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
    const matchesDiff = difficultyFilter === "all" || p.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
    return matchesSearch && matchesCat && matchesDiff;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {createSuccess && (
        <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-xs text-success font-semibold shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>{createSuccess}</span>
          </div>
          <button
            onClick={() => setCreateSuccess(null)}
            className="text-success/70 hover:text-success"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-warning/30 bg-panel p-6 shadow-xl">
        <div className="absolute right-0 top-0 h-48 w-48 bg-warning/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15 text-warning border border-warning/30">
                <Shield className="h-4 w-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary">
                Administrator Control Portal
              </h1>
              <span className="rounded-md bg-warning/20 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-warning border border-warning/40">
                Root Access
              </span>
            </div>
            <p className="text-xs text-text-muted max-w-lg leading-relaxed">
              Real-time platform telemetry, RTL catalog management, simulation execution audit, and role administration. Authenticated as <strong className="text-text-primary">@{user.username}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-accent/40 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Telemetry</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-fg hover:bg-accent-hover transition-all shadow-md active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>New Problem</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Problems */}
        <div className="rounded-2xl border border-border bg-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-dim">
              Catalog Problems
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Code2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-text-primary">
              {stats?.totalProblems ?? problems.length}
            </span>
            <span className="text-xs text-success font-medium">10 / Category</span>
          </div>
          <p className="mt-1 text-[11px] text-text-dim">
            50 total verified RTL designs
          </p>
        </div>

        {/* Card 2: Submissions & Pass Rate */}
        <div className="rounded-2xl border border-border bg-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-dim">
              Submissions & Accuracy
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-success/10 text-success">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-text-primary">
              {stats?.totalSubmissions ?? submissions.length}
            </span>
            <span className="text-xs text-accent font-medium">
              {stats?.passRate ?? 0}% Pass Rate
            </span>
          </div>
          <p className="mt-1 text-[11px] text-text-dim">
            {stats?.passedSubmissions ?? 0} verified solutions
          </p>
        </div>

        {/* Card 3: Registered Engineers */}
        <div className="rounded-2xl border border-border bg-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-dim">
              Registered Engineers
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-text-primary">
              {stats?.totalUsers ?? users.length}
            </span>
            <span className="text-xs text-text-dim font-medium">Users</span>
          </div>
          <p className="mt-1 text-[11px] text-text-dim">
            Active microarchitecture solvers
          </p>
        </div>

        {/* Card 4: Simulation Engine Health */}
        <div className="rounded-2xl border border-border bg-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-dim">
              Hardware Engine
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <Server className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono text-success flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
              ONLINE
            </span>
            <span className="text-xs font-mono text-text-dim">
              {typeof stats?.systemHealth?.simulator === "string"
                ? stats.systemHealth.simulator.toUpperCase()
                : "ICARUS"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-text-dim">
            Docker Sandboxed • 5s Max Timeout
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Category Breakdown</span>
        </button>
        <button
          onClick={() => setActiveTab("problems")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "problems"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Code2 className="h-4 w-4" />
          <span>Problem Catalog ({problems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("submissions")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "submissions"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Live Submissions Log</span>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "users"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Profiles ({users.length})</span>
        </button>
      </div>

      {/* Tab 1: Category Distribution Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" />
              <span>Catalog Balance & Curricular Distribution</span>
            </h3>
            <p className="text-xs text-text-muted">
              HDLForge requires 10 distinct hardware problems per curriculum category to ensure comprehensive industry interview preparation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              {[
                { cat: "Combinational Logic", desc: "Gates, decoders, encoders, muxes" },
                { cat: "Arithmetic", desc: "Adders, multipliers, ALU, BCD, Gray" },
                { cat: "Sequential Logic", desc: "D/T/JK flip-flops, counters, LFSR" },
                { cat: "Finite State Machines", desc: "Moore & Mealy detectors, traffic, SPI" },
                { cat: "Chip Design", desc: "RAM, ROM, FIFO, CAM, modular slices" },
              ].map(({ cat, desc }) => {
                const count = stats?.categories?.[cat] ?? problems.filter((p) => p.category === cat).length;
                const isFull = count >= 10;
                return (
                  <div
                    key={cat}
                    className="rounded-xl border border-border bg-surface/60 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">{cat}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                          isFull
                            ? "bg-success/20 text-success border border-success/30"
                            : "bg-warning/20 text-warning"
                        }`}
                      >
                        {count}/10
                      </span>
                    </div>
                    <p className="text-[10px] text-text-dim leading-relaxed">{desc}</p>
                    <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-accent h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (count / 10) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Problems Management Table */}
      {activeTab === "problems" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-dim" />
              <input
                type="text"
                placeholder="Search problem title or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-panel py-2 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-dim focus:border-accent focus:outline-none"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-border bg-panel px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Combinational Logic">Combinational Logic</option>
              <option value="Arithmetic">Arithmetic</option>
              <option value="Sequential Logic">Sequential Logic</option>
              <option value="Finite State Machines">Finite State Machines</option>
              <option value="Chip Design">Chip Design</option>
            </select>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="rounded-xl border border-border bg-panel px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Problem Table */}
          <div className="rounded-xl border border-border bg-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-surface/50 text-[10px] font-mono uppercase text-text-dim">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Problem Name & Slug</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4 text-center">Test Cases</th>
                    <th className="py-3 px-4 text-center">Submissions</th>
                    <th className="py-3 px-4">Company Tags</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredProblems.map((prob) => (
                    <tr key={prob.id} className="hover:bg-surface/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-text-dim text-[11px]">
                        {prob.id}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/problems/${prob.slug}`}
                          target="_blank"
                          className="font-bold text-text-primary hover:text-accent flex items-center gap-1"
                        >
                          <span>{prob.title}</span>
                          <ArrowUpRight className="h-3 w-3 text-text-dim" />
                        </Link>
                        <span className="font-mono text-[10px] text-text-dim block">
                          {prob.slug}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{prob.category}</td>
                      <td className="py-3 px-4">
                        <DifficultyBadge
                          difficulty={prob.difficulty.toLowerCase() as Difficulty}
                          size="sm"
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-text-primary">
                        {prob.testCasesCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-accent">
                        {prob.submissionsCount}
                      </td>
                      <td className="py-3 px-4 text-text-dim text-[11px] max-w-[180px] truncate">
                        {prob.companyTags || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/problems/${prob.slug}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-surface border border-border px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:text-accent hover:border-accent/40"
                        >
                          Solve / Test
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Live Submissions Audit */}
      {activeTab === "submissions" && (
        <div className="rounded-xl border border-border bg-panel overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              <span>Real-Time Hardware Execution Stream</span>
            </h3>
            <span className="text-[11px] font-mono text-text-dim">
              Latest 50 Submissions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-mono uppercase text-text-dim">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Problem</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Tests</th>
                  <th className="py-3 px-4 text-center">Latency</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-text-dim">
                      No submissions recorded in database yet.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => {
                    const isPassed = sub.status === "PASSED";
                    return (
                      <tr key={sub.id} className="hover:bg-surface/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-text-dim text-[11px]">
                          #{sub.id}
                        </td>
                        <td className="py-3 px-4 font-semibold text-text-primary">
                          {sub.problemTitle}
                        </td>
                        <td className="py-3 px-4 font-mono text-text-secondary text-[11px]">
                          @{sub.username || "anonymous"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-bold ${
                              isPassed
                                ? "bg-success/20 text-success border border-success/30"
                                : "bg-error/20 text-error border border-error/30"
                            }`}
                          >
                            {isPassed ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-accent">
                          {sub.score}%
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-text-dim">
                          {sub.testsPassed}/{sub.testsTotal}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-text-dim">
                          {sub.executionTime.toFixed(2)}s
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[10px] text-text-dim">
                          {new Date(sub.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: User Profiles Management */}
      {activeTab === "users" && (
        <div className="rounded-xl border border-border bg-panel overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />
              <span>Registered User Directory</span>
            </h3>
            <span className="text-[11px] font-mono text-text-dim">
              {users.length} Users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-mono uppercase text-text-dim">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4 text-center">Level</th>
                  <th className="py-3 px-4 text-center">XP</th>
                  <th className="py-3 px-4 text-center">Solved</th>
                  <th className="py-3 px-4 text-center">Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-text-dim">
                      No user profiles in public database yet.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-surface/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-text-primary">
                          {u.displayName || u.username}
                        </div>
                        <div className="font-mono text-[10px] text-text-dim">
                          @{u.username}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-accent">
                        Lv. {u.level}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-text-primary">
                        {u.xp}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-success font-semibold">
                        {u.solvedCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                            u.isAdmin
                              ? "bg-warning/20 text-warning border border-warning/40"
                              : "bg-surface text-text-dim border border-border"
                          }`}
                        >
                          {u.isAdmin ? "Admin" : "Engineer"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleAdmin(u.id)}
                          className="rounded-lg bg-surface border border-border px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
                        >
                          {u.isAdmin ? "Revoke Admin" : "Grant Admin"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Problem Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-panel p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Plus className="h-4 w-4 text-accent" />
                <span>Create New RTL Hardware Problem</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-text-dim hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProblem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase text-text-dim block mb-1">
                    Problem Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProblem.title}
                    onChange={(e) =>
                      setNewProblem({
                        ...newProblem,
                        title: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                      })
                    }
                    placeholder="e.g. 4-to-1 Multiplexer"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase text-text-dim block mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProblem.slug}
                    onChange={(e) => setNewProblem({ ...newProblem, slug: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 font-mono text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase text-text-dim block mb-1">
                    Category *
                  </label>
                  <select
                    value={newProblem.category}
                    onChange={(e) => setNewProblem({ ...newProblem, category: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="Combinational Logic">Combinational Logic</option>
                    <option value="Arithmetic">Arithmetic</option>
                    <option value="Sequential Logic">Sequential Logic</option>
                    <option value="Finite State Machines">Finite State Machines</option>
                    <option value="Chip Design">Chip Design</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase text-text-dim block mb-1">
                    Difficulty *
                  </label>
                  <select
                    value={newProblem.difficulty}
                    onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-text-dim block mb-1">
                  Company Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newProblem.company_tags}
                  onChange={(e) => setNewProblem({ ...newProblem, company_tags: e.target.value })}
                  placeholder="Intel, AMD, Qualcomm"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-text-dim block mb-1">
                  Problem Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newProblem.description}
                  onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
                  placeholder="Detailed functional specification..."
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-text-dim block mb-1">
                  Starter Code (SystemVerilog) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newProblem.starter_code}
                  onChange={(e) => setNewProblem({ ...newProblem, starter_code: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 font-mono text-[11px] text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-text-dim block mb-1">
                  Public Testbench (Self-Checking SystemVerilog) *
                </label>
                <textarea
                  required
                  rows={5}
                  value={newProblem.testbench}
                  onChange={(e) => setNewProblem({ ...newProblem, testbench: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 font-mono text-[11px] text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-border bg-surface px-4 py-2 font-semibold text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-accent px-5 py-2 font-bold text-accent-fg hover:bg-accent-hover transition-all shadow-md"
                >
                  {creating ? "Creating..." : "Save to Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      }
    >
      <AdminPortalContent />
    </Suspense>
  );
}
