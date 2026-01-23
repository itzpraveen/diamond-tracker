"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VERSION_ENDPOINT = "/api/version";
const CHECK_INTERVAL_MS = 2 * 60 * 1000;
const RELOAD_DELAY_MS = 10 * 1000;
const CHANNEL_NAME = "majestic-app-version";
const STORAGE_KEY = "majestic-app-version";

type VersionPayload = {
  version: string;
  buildTime: string;
};

function isSameVersion(a: VersionPayload, b: VersionPayload) {
  return a.version === b.version && a.buildTime === b.buildTime;
}

async function fetchVersion(): Promise<VersionPayload | null> {
  try {
    const response = await fetch(`${VERSION_ENDPOINT}?ts=${Date.now()}`, {
      cache: "no-store"
    });
    if (!response.ok) return null;
    const data = (await response.json()) as VersionPayload;
    if (!data.version || !data.buildTime) return null;
    return data;
  } catch {
    return null;
  }
}

export default function VersionWatcher() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const currentVersionRef = useRef<VersionPayload | null>(null);
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const triggeredRef = useRef(false);

  const triggerUpdate = (payload: VersionPayload) => {
    if (triggeredRef.current) return;
    if (currentVersionRef.current && isSameVersion(currentVersionRef.current, payload)) {
      return;
    }
    triggeredRef.current = true;
    setUpdateAvailable(true);
    setCountdown(Math.ceil(RELOAD_DELAY_MS / 1000));

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage failures
    }

    if (channelRef.current) {
      channelRef.current.postMessage({ type: "update", payload });
    }

    timerRef.current = window.setTimeout(() => {
      window.location.reload();
    }, RELOAD_DELAY_MS);

    countdownRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const initial = await fetchVersion();
      if (!mounted || !initial) return;
      currentVersionRef.current = initial;
    };

    init();

    const checkForUpdate = async () => {
      if (updateAvailable) return;
      const latest = await fetchVersion();
      if (!latest) return;
      if (!currentVersionRef.current) {
        currentVersionRef.current = latest;
        return;
      }
      if (!isSameVersion(currentVersionRef.current, latest)) {
        triggerUpdate(latest);
      }
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        checkForUpdate();
      }
    };

    const interval = window.setInterval(checkForUpdate, CHECK_INTERVAL_MS);
    window.addEventListener("focus", checkForUpdate);
    document.addEventListener("visibilitychange", handleVisibility);

    if ("BroadcastChannel" in window) {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current.onmessage = (event) => {
        if (event.data?.type === "update") {
          triggerUpdate(event.data.payload as VersionPayload);
        }
      };
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue) as VersionPayload;
        triggerUpdate(payload);
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", checkForUpdate);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("storage", handleStorage);
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (countdownRef.current) {
        window.clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [updateAvailable]);

  if (!updateAvailable) return null;

  return (
    <div className="sticky top-0 z-50">
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-b-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-[var(--shadow-sm)]",
          "sm:mx-4 sm:mt-4 sm:rounded-2xl"
        )}
      >
        <div className="flex flex-col gap-1">
          <span className="font-semibold">New version available</span>
          <span className="text-xs text-amber-800/80">
            This tab will refresh in {countdown ?? Math.ceil(RELOAD_DELAY_MS / 1000)}s.
          </span>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          Reload now
        </Button>
      </div>
    </div>
  );
}
