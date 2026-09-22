"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
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
  const supabase = createClient();

  const loadUserProfile = useCallback(async (authUser: { id: string; email?: string; created_at: string; last_sign_in_at?: string; user_metadata?: Record<string, unknown> } | null) => {
    if (!authUser) {
      setUser(null);
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
      });
    } catch (err) {
      console.warn("Failed to fetch profile:", err);
      // Fallback to basic auth metadata
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
    }
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    if (!isSupabaseConfigured()) {
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
      await loadUserProfile(authUser);
    } catch {
      setUser(null);
    }
  }, [supabase, loadUserProfile]);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured()) {
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
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (mounted) {
          await loadUserProfile(authUser);
        }
      } catch (err) {
        console.warn("Auth initialization error:", err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadUserProfile]);

  const login = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      const data = await backendFetch<BackendAuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(mapBackendUser(data.user));
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message || "Invalid email or password");
    }

    if (data.user) {
      await loadUserProfile(data.user);
    }
  }, [supabase, loadUserProfile]);

  const register = useCallback(async (email: string, username: string, password: string, displayName?: string) => {
    if (!isSupabaseConfigured()) {
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName || username,
        },
      },
    });

    if (error) {
      throw new Error(error.message || "Registration failed");
    }

    // signUp does not always return a session (e.g. when email confirmation is
    // enabled). Establish one right away so signup and login share one session.
    if (!data.session) {
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

    if (data.user) {
      await loadUserProfile(data.user);
    }
  }, [supabase, loadUserProfile]);

  const logout = useCallback(async () => {
    if (!isSupabaseConfigured()) {
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