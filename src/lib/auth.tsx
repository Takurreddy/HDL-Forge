"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "./types";
import { createClient } from "./supabase/client";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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
      const emailLower = (authUser.email || "").toLowerCase();
      const isAdmin = Boolean(
        profile?.is_admin ||
        metadata.is_admin ||
        emailLower === "admin@hdlforge.com" ||
        emailLower === "bvsrujan@gmail.com" ||
        username.toLowerCase() === "admin" ||
        username.toLowerCase() === "bvs" ||
        username.toLowerCase() === "bvsrujan"
      );

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
      const emailLower = (authUser.email || "").toLowerCase();
      const uname = (metadata.username as string) || authUser.email?.split("@")[0] || "User";
      const isAdmin = Boolean(
        metadata.is_admin ||
        emailLower === "admin@hdlforge.com" ||
        emailLower === "bvsrujan@gmail.com" ||
        uname.toLowerCase() === "admin" ||
        uname.toLowerCase() === "bvs" ||
        uname.toLowerCase() === "bvsrujan"
      );
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
        isAdmin,
      });
    }
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await loadUserProfile(authUser);
        return;
      }
      // Check local backend token
      const localToken = typeof window !== "undefined" ? localStorage.getItem("hdlforge_token") : null;
      if (localToken) {
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
      }
      setUser(null);
    } catch {
      setUser(null);
    }
  }, [supabase, loadUserProfile]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          syncToken(session.access_token);
        }
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (mounted && authUser) {
          await loadUserProfile(authUser);
          return;
        }

        // Check local backend token if supabase user was absent
        const localToken = typeof window !== "undefined" ? localStorage.getItem("hdlforge_token") : null;
        if (localToken) {
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
            return;
          }
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
      if (session?.access_token) {
        syncToken(session.access_token);
      }
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        const localToken = typeof window !== "undefined" ? localStorage.getItem("hdlforge_token") : null;
        if (!localToken) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadUserProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const emailClean = email.trim();

    // 1. Try Supabase Auth first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailClean,
        password,
      });

      if (!error && data.user) {
        if (data.session?.access_token) {
          syncToken(data.session.access_token);
        }
        await loadUserProfile(data.user);
        return;
      }
    } catch {
      // Fall through to backend auth
    }

    // 2. Fall back to backend auth (/api/auth/login)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: emailClean, password }),
      });

      if (res.ok) {
        const data = await res.json();
        syncToken(data.token);
        const u = data.user;
        const isAdmin = Boolean(
          u.is_admin ||
          emailClean.toLowerCase() === "admin@hdlforge.com" ||
          emailClean.toLowerCase() === "admin" ||
          u.username.toLowerCase() === "admin" ||
          u.username.toLowerCase() === "bvs" ||
          u.username.toLowerCase() === "bvsrujan"
        );
        setUser({
          id: u.id,
          email: emailClean.includes("@") ? emailClean : `${u.username}@hdlforge.local`,
          username: u.username,
          displayName: u.display_name,
          avatarUrl: u.avatar_url,
          createdAt: u.created_at,
          lastLoginAt: u.last_login_at,
          xp: 0,
          level: 1,
          solvedCount: 0,
          isAdmin,
        });
        return;
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || "Invalid email or password");
    } catch (backendErr: any) {
      throw new Error(backendErr.message || "Invalid email or password");
    }
  }, [supabase, loadUserProfile]);

  const register = useCallback(async (email: string, username: string, password: string, displayName?: string) => {
    // 1. Try Supabase
    try {
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

      if (!error && data.user) {
        if (data.session?.access_token) {
          syncToken(data.session.access_token);
        }
        await loadUserProfile(data.user);
        return;
      }
    } catch {
      // Fall through to backend register
    }

    // 2. Fall back to backend register
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email,
        username,
        password,
        display_name: displayName || username,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      syncToken(data.token);
      const u = data.user;
      setUser({
        id: u.id,
        email,
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

    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.detail || "Registration failed");
  }, [supabase, loadUserProfile]);

  const logout = useCallback(async () => {
    syncToken(null);
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {}
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
