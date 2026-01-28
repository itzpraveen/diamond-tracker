"use client";

import { useCallback } from "react";

import { useAuth } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/apiBase";

const API_BASE_URL = getApiBaseUrl();

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
        try {
          await refresh();
        } catch (error) {
          logout({ reason: "expired" });
          throw error instanceof Error ? error : new Error("Session expired");
        }
        response = await doFetch(localStorage.getItem("diamond_access_token") || undefined);
      }
      if (!response.ok) {
        if (response.status === 401) {
          logout({ reason: "expired" });
        }
        const text = await response.text();
        if (text) {
          try {
            const parsed = JSON.parse(text);
            if (parsed?.errors && typeof parsed.errors === "object") {
              const parts = Object.entries(parsed.errors).map(([field, message]) => `${field}: ${message}`);
              const prefix = parsed.message ? `${parsed.message} ` : "";
              throw new Error(prefix + parts.join(", "));
            }
          } catch {
            // Fall back to raw text if parsing fails.
          }
        }
        throw new Error(text || "Request failed");
      }
      if (response.status === 204) {
        return {} as T;
      }
      return (await response.json()) as T;
    },
    [accessToken, refresh, logout]
  );

  const requestBlob = useCallback(
    async (path: string, options: RequestInit = {}) => {
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
        try {
          await refresh();
        } catch (error) {
          logout({ reason: "expired" });
          throw error instanceof Error ? error : new Error("Session expired");
        }
        response = await doFetch(localStorage.getItem("diamond_access_token") || undefined);
      }
      if (!response.ok) {
        if (response.status === 401) {
          logout({ reason: "expired" });
        }
        const text = await response.text();
        throw new Error(text || "Request failed");
      }
      return response.blob();
    },
    [accessToken, refresh, logout]
  );

  return { request, requestBlob };
}
