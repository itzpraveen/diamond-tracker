"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();

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
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 lg:flex-row lg:gap-10 lg:px-8">
        <div className="w-full lg:hidden">
          <div className="rounded-3xl border border-ink/10 bg-white/85 p-4 shadow-[var(--shadow)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Majestic Tracking"
                  width={40}
                  height={40}
                  className="rounded-xl border border-ink/10 bg-white"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate">Majestic Tracking</p>
                  <p className="text-lg font-semibold font-display">Tracking Ops</p>
                </div>
              </div>
              <Button variant="outline" onClick={logout}>
                Sign out
              </Button>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto text-sm">
              {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition",
                      isActive
                        ? "border-gold/50 bg-white text-ink shadow-sm"
                        : "border-ink/10 bg-white/70 text-slate hover:border-ink/30 hover:text-ink"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate">Role: {role || "unknown"}</p>
          </div>
        </div>
        <aside className="hidden w-64 flex-shrink-0 flex-col gap-6 lg:flex">
          <div className="rounded-3xl border border-ink/10 bg-white/85 p-5 shadow-[var(--shadow)]">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Majestic Tracking"
                width={44}
                height={44}
                className="rounded-xl border border-ink/10 bg-white"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate">Majestic Tracking</p>
                <p className="mt-1 text-xl font-semibold font-display">Tracking Ops</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-ink/10 bg-white/70 px-3 py-2 text-xs text-slate">
              Role: <span className="font-semibold text-ink">{role || "unknown"}</span>
            </div>
          </div>
          <nav className="flex flex-col gap-2 text-sm">
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                    isActive
                      ? "border-gold/40 bg-white text-ink shadow-[0_16px_30px_rgba(15,23,20,0.08)]"
                      : "border-transparent text-slate hover:border-ink/10 hover:bg-white/70 hover:text-ink"
                  )}
                >
                  {link.label}
                  <span className={cn("text-xs uppercase tracking-[0.2em]", isActive ? "text-gold" : "text-slate/60")}>
                    {link.label.slice(0, 2)}
                  </span>
                </Link>
              );
            })}
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
