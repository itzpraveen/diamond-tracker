"use client";

import { useState } from "react";

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
        <div className="mx-auto max-w-md">
          <Card className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate">Diamond</p>
              <h1 className="mt-2 text-2xl font-semibold">Admin Console Login</h1>
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
            {error && <p className="text-sm text-amber">{error}</p>}
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
