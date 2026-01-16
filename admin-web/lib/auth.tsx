"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";

const ACCESS_KEY = "diamond_access_token";
const REFRESH_KEY = "diamond_refresh_token";

export type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  roles: string[];
  primaryRole: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeRoles(token: string | null): string[] {
  if (!token) return [];
  try {
    const payload = token.split(".")[1];
    let normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4) {
      normalized += "=";
    }
    const decoded = JSON.parse(atob(normalized));
    if (Array.isArray(decoded.roles)) {
      return decoded.roles.filter((role: unknown) => typeof role === "string");
    }
    if (decoded.role) {
      return [decoded.role];
    }
    return [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAccess = localStorage.getItem(ACCESS_KEY);
    const storedRefresh = localStorage.getItem(REFRESH_KEY);
    setAccessToken(storedAccess);
    setRefreshToken(storedRefresh);
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const tokens = await api.login(username, password);
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);
  };

  const refresh = async () => {
    if (!refreshToken) return;
    const tokens = await api.refresh(refreshToken);
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setAccessToken(null);
    setRefreshToken(null);
  };

  const value = useMemo(() => {
    const decodedRoles = decodeRoles(accessToken);
    return {
      accessToken,
      refreshToken,
      roles: decodedRoles,
      primaryRole: decodedRoles[0] ?? null,
      isLoading,
      login,
      logout,
      refresh
    };
  }, [accessToken, refreshToken, isLoading]);

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
