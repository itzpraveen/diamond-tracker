"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { api, type SessionUser } from "@/lib/api";

const ACCESS_KEY = "diamond_access_token";
const REFRESH_KEY = "diamond_refresh_token";

export type AuthContextValue = {
  user: SessionUser | null;
  isAuthenticated: boolean;
  roles: string[];
  primaryRole: string | null;
  isLoading: boolean;
  notice: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: (options?: { reason?: "expired" | "manual" }) => void;
  dismissNotice: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getLegacyRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

function clearLegacyTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const refreshInFlight = useRef<Promise<void> | null>(null);

  const loadSession = async () => {
    const session = await api.me();
    setUser(session);
  };

  const attemptRefresh = async (allowLegacyFallback = false) => {
    try {
      await api.refresh();
      return;
    } catch (cookieError) {
      if (!allowLegacyFallback) {
        throw cookieError;
      }
      const legacyRefreshToken = getLegacyRefreshToken();
      if (!legacyRefreshToken) {
        throw cookieError;
      }
      await api.refresh(legacyRefreshToken);
    }
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        await loadSession();
      } catch {
        try {
          await attemptRefresh(true);
          if (!mounted) return;
          await loadSession();
        } catch {
          if (mounted) {
            setUser(null);
          }
        }
      } finally {
        clearLegacyTokens();
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (username: string, password: string) => {
    await api.login(username, password);
    await loadSession();
    clearLegacyTokens();
    setNotice(null);
  };

  const clearSession = () => {
    clearLegacyTokens();
    setUser(null);
  };

  const refresh = async () => {
    if (refreshInFlight.current) {
      return refreshInFlight.current;
    }
    const run = (async () => {
      try {
        await attemptRefresh(true);
        await loadSession();
        clearLegacyTokens();
      } catch (error) {
        clearSession();
        throw error;
      } finally {
        refreshInFlight.current = null;
      }
    })();
    refreshInFlight.current = run;
    return run;
  };

  const logout = (options?: { reason?: "expired" | "manual" }) => {
    refreshInFlight.current = null;
    const legacyRefreshToken = getLegacyRefreshToken();
    if (options?.reason === "expired") {
      setNotice("Session expired. Please sign in again.");
    } else {
      setNotice(null);
    }
    clearSession();
    void api.logout(legacyRefreshToken ?? undefined).catch(() => undefined);
  };

  const dismissNotice = () => setNotice(null);

  const value = useMemo(() => {
    const roles = user?.roles ?? [];
    return {
      user,
      isAuthenticated: Boolean(user),
      roles,
      primaryRole: roles[0] ?? null,
      isLoading,
      notice,
      login,
      logout,
      dismissNotice,
      refresh
    };
  }, [user, isLoading, notice]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function RoleGate({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { roles: userRoles } = useAuth();
  if (!userRoles.length || !roles.some((role) => userRoles.includes(role))) return null;
  return <>{children}</>;
}
