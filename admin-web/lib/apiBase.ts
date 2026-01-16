const PRODUCTION_API_BASE_URL = "https://tracking-backend.majesticjewellers.com";
const LOCAL_API_BASE_URL = "http://localhost:8000";

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) {
    if (typeof window !== "undefined" && window.location.hostname === "tracking.majesticjewellers.com") {
      return PRODUCTION_API_BASE_URL;
    }
    return envUrl;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "tracking.majesticjewellers.com") {
      return PRODUCTION_API_BASE_URL;
    }
    if (host === "localhost" || host === "127.0.0.1") {
      return LOCAL_API_BASE_URL;
    }
  }
  return PRODUCTION_API_BASE_URL;
}
