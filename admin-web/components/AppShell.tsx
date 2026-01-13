"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/items", label: "Items" },
  { href: "/batches", label: "Batches" },
  { href: "/incidents", label: "Incidents" },
  { href: "/reports", label: "Reports" },
  { href: "/audit", label: "Audit Log" },
  { href: "/users", label: "Users" }
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { logout, role, accessToken } = useAuth();

  if (!accessToken) {
    return (
      <div className="min-h-screen px-6 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-ink/10 bg-white/80 p-6 text-center shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/logo.png"
              alt="Majestic Tracking"
              width={56}
              height={56}
              className="rounded-xl border border-ink/10 bg-white"
            />
            <p className="text-xs uppercase tracking-[0.3em] text-slate">Majestic Tracking</p>
          </div>
          <p className="mt-2 text-xl font-semibold">Please sign in</p>
          <p className="mt-2 text-sm text-slate">Your session has expired.</p>
          <Link className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-sm text-white" href="/">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-10">
        <div className="lg:hidden w-full rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Majestic Tracking"
                width={36}
                height={36}
                className="rounded-lg border border-ink/10 bg-white"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate">Majestic Tracking</p>
                <p className="text-lg font-semibold">Tracking Ops</p>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              Sign out
            </Button>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-full border border-ink/10 bg-white px-3 py-1"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate">Role: {role || "unknown"}</p>
        </div>
        <aside className="hidden w-56 flex-shrink-0 flex-col gap-6 lg:flex">
          <div className="rounded-2xl border border-ink/10 bg-white/80 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Majestic Tracking"
                width={40}
                height={40}
                className="rounded-lg border border-ink/10 bg-white"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate">Majestic Tracking</p>
                <p className="mt-1 text-xl font-semibold">Tracking Ops</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate">Role: {role || "unknown"}</p>
          </div>
          <nav className="flex flex-col gap-2 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-transparent px-4 py-2 transition hover:border-ink/10 hover:bg-white/70"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        </aside>
        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}
