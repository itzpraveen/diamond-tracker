"use client";

import { useState } from "react";
import Image from "next/image";

import AppShell from "@/components/AppShell";
import Dashboard from "@/components/Dashboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { accessToken, login, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  if (isLoading) {
    return <div className="p-10">Loading...</div>;
  }

  if (!accessToken) {
    return (
      <div className="min-h-screen px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between rounded-3xl border border-ink/10 bg-white/80 p-8 shadow-[var(--shadow)]">
            <div>
              <Image
                src="/logo.png"
                alt="Majestic Tracking"
                width={64}
                height={64}
                className="rounded-2xl border border-ink/10 bg-white"
              />
              <p className="mt-6 text-xs uppercase tracking-[0.4em] text-slate">Majestic Tracking</p>
              <h1 className="mt-4 text-3xl font-semibold font-display">Luxury Logistics, Fully Accounted.</h1>
              <p className="mt-4 text-sm text-slate">
                Track every item with precision handovers, audit-grade scanning, and calm, deliberate workflows.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate">
              <span className="rounded-full border border-ink/10 bg-white/70 px-3 py-1">Secure chain of custody</span>
              <span className="rounded-full border border-ink/10 bg-white/70 px-3 py-1">Dispatch intelligence</span>
              <span className="rounded-full border border-ink/10 bg-white/70 px-3 py-1">Exceptional audit trail</span>
            </div>
          </div>
          <Card className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate">Sign in</p>
              <h2 className="mt-2 text-2xl font-semibold font-display">Admin Console</h2>
              <p className="mt-2 text-sm text-slate">Use your credentials to continue.</p>
            </div>
            <Input
              placeholder="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error && <p className="text-sm text-[#8a5c1b]">{error}</p>}
            <Button className="w-full" onClick={handleLogin}>
              Sign in
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
