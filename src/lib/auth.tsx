"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { User } from "./types";
import { createClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/queries";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

interface BackendUser {
  id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  last_login_at?: string | null;
}

interface BackendAuthResponse {
  user: BackendUser;
  token: string;
}

function mapBackendUser(u: BackendUser): User {
  return {
    id: u.id,
    email: "",
    username: u.username,
    displayName: u.display_name ?? null,
    avatarUrl: u.avatar_url ?? null,
    createdAt: u.created_at || new Date().toISOString(),
    lastLoginAt: u.last_login_at ?? null,
    xp: 0,
    level: 1,
    solvedCount: 0,
  };
}

async function backendFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = (body as { detail?: unknown }).detail;
    const message =
      typeof detail === "string" ? detail : `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(
    () => (isSupabaseConfigured() ? createClient() : null),
    [],
  );

  const syncToken = (token?: string | null) => {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem("hdlforge_token", token);
      document.cookie = `access_token=${token}; path=/; max-age=259200; SameSite=Lax`;
    } else {
      localStorage.removeItem("hdlforge_token");
      document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
    }
  };

  const loadUserProfile = useCallback(async (authUser: { id: string; email?: string; created_at: string; last_sign_in_at?: string; user_metadata?: Record<string, unknown> } | null) => {
    if (!authUser) {
      setUser(null);
      return;
    }

    if (!supabase) {
      const metadata = authUser.user_metadata || {};
      setUser({
        id: authUser.id,
        email: authUser.email || "",
        username: (metadata.username as string) || authUser.email?.split("@")[0] || "User",
        displayName: (metadata.display_name as string) || null,
        avatarUrl: null,
        createdAt: authUser.created_at,
        lastLoginAt: authUser.last_sign_in_at || null,
        xp: 0,
        level: 1,
        solvedCount: 0,
      });
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.warn("Could not load user profile:", error.message);
      }

      const metadata = authUser.user_metadata || {};
      const username = profile?.username || (metadata.username as string) || authUser.email?.split("@")[0] || "User";
      const displayName = profile?.display_name || (metadata.display_name as string) || (metadata.username as string) || null;
      const isAdmin = Boolean(profile?.is_admin);

      setUser({
        id: authUser.id,
        email: authUser.email || "",
        username,
        displayName,
        avatarUrl: profile?.avatar_url || null,
        createdAt: profile?.created_at || authUser.created_at,
        lastLoginAt: profile?.last_login_at || authUser.last_sign_in_at || null,
        xp: profile?.xp ?? 0,
        level: profile?.level ?? 1,
        solvedCount: profile?.solved_count ?? 0,
        isAdmin,
      });
    } catch (err) {
      console.warn("Failed to fetch profile:", err);
      // Fallback to basic auth metadata
      const metadata = authUser.user_metadata || {};
      const uname = (metadata.username as string) || authUser.email?.split("@")[0] || "User";
      setUser({
        id: authUser.id,
        email: authUser.email || "",
        username: uname,
        displayName: (metadata.display_name as string) || null,
        avatarUrl: null,
        createdAt: authUser.created_at,
        lastLoginAt: authUser.last_sign_in_at || null,
        xp: 0,
        level: 1,
        solvedCount: 0,
        isAdmin: false,
      });
    }
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    if (!supabase) {
      try {
        const backendUser = await backendFetch<BackendUser>("/api/auth/me");
        setUser(mapBackendUser(backendUser));
      } catch {
        setUser(null);
      }
      return;
    }

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await loadUserProfile(authUser);
        return;
      }
    } catch {
      // Supabase unavailable — fall through to local token
    }
    // Check local backend token
    const localToken = typeof window !== "undefined" ? localStorage.getItem("hdlforge_token") : null;
    if (localToken) {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${localToken}` },
        });
        if (res.ok) {
          const u = await res.json();
          setUser({
            id: u.id,
            email: `${u.username}@hdlforge.local`,
            username: u.username,
            displayName: u.display_name,
            avatarUrl: u.avatar_url,
            createdAt: u.created_at,
            lastLoginAt: u.last_login_at,
            xp: 0,
            level: 1,
            solvedCount: 0,
            isAdmin: Boolean(u.is_admin),
          });
          return;
        }
      } catch {}
    }
    setUser(null);
  }, [supabase, loadUserProfile]);

  useEffect(() => {
    let mounted = true;
    // Guard: onAuthStateChange must not interfere until initAuth completes
    let initComplete = false;

    async function restoreLocalSession(): Promise<boolean> {
      const localToken = typeof window !== "undefined" ? localStorage.getItem("hdlforge_token") : null;
      if (!localToken || !mounted) return false;
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${localToken}` },
        });
        if (res.ok && mounted) {
          const u = await res.json();
          setUser({
            id: u.id,
            email: `${u.username}@hdlforge.local`,
            username: u.username,
            displayName: u.display_name,
            avatarUrl: u.avatar_url,
            createdAt: u.created_at,
            lastLoginAt: u.last_login_at,
            xp: 0,
            level: 1,
            solvedCount: 0,
            isAdmin: Boolean(u.is_admin),
          });
          return true;
        }
        // Token expired or invalid — clean it up
        syncToken(null);
      } catch {
        // Backend unreachable — don't nuke the token, user can retry
      }
      return false;
    }

    if (!supabase) {
      void (async () => {
        try {
          const backendUser = await backendFetch<BackendUser>("/api/auth/me");
          if (mounted) {
            setUser(mapBackendUser(backendUser));
          }
        } catch (err) {
          console.warn("Auth initialization error:", err);
          if (mounted) setUser(null);
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }

    async function initAuth() {
      try {
        // 1. Check Supabase session first
        const { data: { session } } = await supabase!.auth.getSession();
        if (session?.access_token) {
          syncToken(session.access_token);
        }
        const { data: { user: authUser } } = await supabase!.auth.getUser();
        if (mounted && authUser) {
          await loadUserProfile(authUser);
          return;
        }

        // 2. No Supabase session — try local backend token
        await restoreLocalSession();
      } catch (err) {
        console.warn("Auth initialization error:", err);
        // Last resort: try local token even if Supabase calls threw
        try { await restoreLocalSession(); } catch {}
      } finally {
        if (mounted) {
          initComplete = true;
          setLoading(false);
        }
      }
    }

    void initAuth();

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      // Skip auth state changes until initAuth finishes to prevent race conditions
      if (!initComplete) return;

      if (session?.access_token) {
        syncToken(session.access_token);
      }
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        // Supabase session ended — only clear user if there's no local token
        const localToken = typeof window !== "undefined" ? localStorage.getItem("hdlforge_token") : null;
        if (!localToken) {
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadUserProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const emailClean = email.trim();
    if (!supabase) {
      const data = await backendFetch<BackendAuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(mapBackendUser(data.user));
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailClean,
      password,
    });
    if (error) throw new Error(error.message);
    if (data.user) {
      if (data.session?.access_token) syncToken(data.session.access_token);
      await loadUserProfile(data.user);
    }
  }, [supabase, loadUserProfile]);

  const register = useCallback(async (email: string, username: string, password: string, displayName?: string) => {
    if (!supabase) {
      const data = await backendFetch<BackendAuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          username,
          password,
          display_name: displayName || username,
        }),
      });
      setUser(mapBackendUser(data.user));
      return;
    }

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName || username,
        },
      },
    });
    if (signupError) throw new Error(signupError.message);

    if (!signupData.user) {
      throw new Error("Registration failed. Please try again.");
    }

    if (!signupData.session) {
      const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        if (/confirm|verification/i.test(signInError.message)) {
          throw new Error("Almost there — check your inbox to confirm your email, then sign in.");
        }
        throw new Error(signInError.message || "Registration failed");
      }
      if (signIn.user) {
        await loadUserProfile(signIn.user);
      }
      return;
    }

    if (signupData.session.access_token) {
      syncToken(signupData.session.access_token);
    }
    await loadUserProfile(signupData.user);
  }, [supabase, loadUserProfile]);

  const logout = useCallback(async () => {
    if (!supabase) {
      await backendFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      setUser(null);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
