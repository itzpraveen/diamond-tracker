"use client";

import { useCallback } from "react";

import { useAuth } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export function useApi() {
  const { accessToken, refresh, logout } = useAuth();

  const request = useCallback(
    async <T>(path: string, options: RequestInit = {}) => {
      const doFetch = async (token?: string) => {
        const headers = new Headers(options.headers || {});
        const isFormData = options.body instanceof FormData;
        if (!isFormData && !headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        const response = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          headers
        });
        return response;
      };

      let response = await doFetch(accessToken || undefined);
      if (response.status === 401) {
        await refresh();
        response = await doFetch(localStorage.getItem("diamond_access_token") || undefined);
      }
      if (!response.ok) {
        if (response.status === 401) {
          logout();
        }
        const text = await response.text();
        throw new Error(text || "Request failed");
      }
      if (response.status === 204) {
        return {} as T;
      }
      return (await response.json()) as T;
    },
    [accessToken, refresh, logout]
  );

  return { request };
}
