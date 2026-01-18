"use client";

import { useState } from "react";
import Image from "next/image";

import AppShell from "@/components/AppShell";
import Dashboard from "@/components/Dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardLabel, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { accessToken, login, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-forest border-t-transparent" />
          <p className="text-sm text-slate">Loading...</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
            {/* Left Panel - Branding */}
            <div className="order-2 lg:order-1">
              <Card variant="elevated" padding="lg" className="h-full">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <Image
                      src="/logo.png"
                      alt="Majestic Tracking"
                      width={56}
                      height={56}
                      className="rounded-xl border border-ink/10 bg-white shadow-sm sm:h-16 sm:w-16"
                    />
                    <CardLabel className="mt-6">Majestic Tracking</CardLabel>
                    <h1 className="mt-3 text-2xl font-semibold font-display sm:text-3xl lg:text-4xl">
                      Luxury Logistics, Fully Accounted.
                    </h1>
                    <p className="mt-4 text-sm text-slate sm:text-base">
                      Track every item with precision handovers, audit-grade scanning, and calm, deliberate workflows.
                    </p>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-2">
                    <span className="rounded-full border border-ink/10 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate">
                      Secure chain of custody
                    </span>
                    <span className="rounded-full border border-ink/10 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate">
                      Dispatch intelligence
                    </span>
                    <span className="rounded-full border border-ink/10 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate">
                      Exceptional audit trail
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Panel - Login Form */}
            <div className="order-1 lg:order-2">
              <Card variant="elevated" padding="lg">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <CardLabel>Sign in</CardLabel>
                    <CardTitle className="mt-2">Admin Console</CardTitle>
                    <CardDescription className="mt-2">
                      Use your credentials to continue.
                    </CardDescription>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-ink">
                        Username
                      </label>
                      <Input
                        id="username"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                        Password
                      </label>
                      <Input
                        id="password"
                        placeholder="Enter your password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting || !username || !password}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Signing in...
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
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
