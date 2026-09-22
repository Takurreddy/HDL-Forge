"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { UserPlus, Cpu, Loader2, ShieldCheck } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, username, password, displayName || undefined);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please check inputs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 py-12 relative bg-background overflow-hidden">
      {/* Glow aura */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[450px] w-[600px] -translate-x-1/2 rounded-full bg-accent/10 blur-[140px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-2xl border border-border bg-panel/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <Link href="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent mb-3 shadow-[0_0_15px_rgba(0,217,165,0.15)]">
              <Cpu className="h-6 w-6" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">Create Your Account</h1>
            <p className="mt-1 text-xs text-text-muted">Join the hardware engineering practice arena</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-error/20 bg-error/5 p-3 text-center text-xs text-error">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-xs text-text-primary placeholder-text-dim outline-none transition-all focus:border-accent/40 focus:shadow-[0_0_12px_rgba(0,217,165,0.1)]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                className="h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-xs text-text-primary placeholder-text-dim outline-none transition-all focus:border-accent/40 focus:shadow-[0_0_12px_rgba(0,217,165,0.1)]"
                placeholder="hdl_engineer"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                Display Name <span className="text-text-dim font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-xs text-text-primary placeholder-text-dim outline-none transition-all focus:border-accent/40 focus:shadow-[0_0_12px_rgba(0,217,165,0.1)]"
                placeholder="Ada Lovelace"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-xs text-text-primary placeholder-text-dim outline-none transition-all focus:border-accent/40 focus:shadow-[0_0_12px_rgba(0,217,165,0.1)]"
                placeholder="At least 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent text-xs font-bold text-[#070707] transition-all hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,217,165,0.25)] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {loading ? "Creating Profile..." : "Create Free Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Bottom Trust Badge */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-text-dim">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Zero Setup Needed
          </span>
          <span>·</span>
          <span>SystemVerilog & Verilog Ready</span>
        </div>
      </div>
    </div>
  );
}
