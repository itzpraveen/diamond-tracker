import { getApiBaseUrl } from "@/lib/apiBase";

const API_BASE_URL = getApiBaseUrl();

export type SessionUser = {
  id: string;
  username: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
};

async function readError(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return "Request failed";
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.detail === "string" && parsed.detail) {
      return parsed.detail;
    }
    if (parsed?.errors && typeof parsed.errors === "object") {
      const parts = Object.entries(parsed.errors).map(([field, message]) => `${field}: ${message}`);
      const prefix = parsed.message ? `${parsed.message} ` : "";
      return prefix + parts.join(", ");
    }
  } catch {
    // Fall back to raw text below.
  }
  return text;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    apiFetch<{ access_token: string; refresh_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    }),
  refresh: (refreshToken?: string) =>
    apiFetch<{ access_token: string; refresh_token: string }>("/auth/refresh", {
      method: "POST",
      body: refreshToken ? JSON.stringify({ refresh_token: refreshToken }) : undefined
    }),
  logout: (refreshToken?: string) =>
    apiFetch<{ ok: boolean }>("/auth/logout", {
      method: "POST",
      body: refreshToken ? JSON.stringify({ refresh_token: refreshToken }) : undefined
    }),
  me: () => apiFetch<SessionUser>("/auth/me")
};
