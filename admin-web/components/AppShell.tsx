"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: "Da" },
  { href: "/items", label: "Items", icon: "It" },
  { href: "/batches", label: "Batches", icon: "Ba" },
  { href: "/incidents", label: "Incidents", icon: "In" },
  { href: "/reports", label: "Reports", icon: "Re" },
  { href: "/audit", label: "Audit Log", icon: "Au" },
  { href: "/users", label: "Users", icon: "Us" },
  { href: "/settings", label: "Settings", icon: "Se" }
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { logout, roles, primaryRole, accessToken } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const roleLabel = roles.length ? roles.join(", ") : primaryRole || "unknown";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!accessToken && pathname !== "/") {
      router.replace("/");
    }
  }, [accessToken, pathname, router]);

  if (!accessToken) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-ink/10 bg-white/90 p-6 text-center shadow-[var(--shadow)] backdrop-blur">
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
          <p className="mt-4 text-xl font-semibold">Please sign in</p>
          <p className="mt-2 text-sm text-slate">Your session has expired.</p>
          <a
            className="mt-6 inline-flex rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,61,51,0.2)] transition hover:bg-pine hover:shadow-[0_12px_28px_rgba(15,61,51,0.25)]"
            href="/"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh]">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 lg:hidden">
        <div className="mx-4 mt-4">
          <div className="rounded-2xl border border-ink/10 bg-white/90 px-4 py-3 shadow-[var(--shadow-sm)] backdrop-blur">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 transition hover:opacity-80">
                <Image
                  src="/logo.png"
                  alt="Majestic Tracking"
                  width={36}
                  height={36}
                  className="rounded-lg border border-ink/10 bg-white"
                />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-slate">Majestic</p>
                  <p className="text-sm font-semibold font-display">Tracking</p>
                </div>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-ink/10 bg-white/80 transition active:scale-95"
                aria-label="Toggle menu"
              >
                <div className="flex flex-col gap-1.5">
                  <span
                    className={cn(
                      "block h-0.5 w-5 rounded-full bg-ink transition-all duration-300",
                      mobileMenuOpen && "translate-y-2 rotate-45"
                    )}
                  />
                  <span
                    className={cn(
                      "block h-0.5 w-5 rounded-full bg-ink transition-all duration-300",
                      mobileMenuOpen && "opacity-0"
                    )}
                  />
                  <span
                    className={cn(
                      "block h-0.5 w-5 rounded-full bg-ink transition-all duration-300",
                      mobileMenuOpen && "-translate-y-2 -rotate-45"
                    )}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-ink/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <nav
        className={cn(
          "fixed inset-x-4 top-[88px] z-40 max-h-[calc(100dvh-104px)] overflow-y-auto rounded-2xl border border-ink/10 bg-white/95 p-4 shadow-[var(--shadow-lg)] backdrop-blur transition-all duration-300 lg:hidden",
          mobileMenuOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-4 opacity-0"
        )}
      >
        <div className="mb-4 rounded-xl border border-ink/10 bg-sand/50 px-3 py-2">
          <p className="text-xs text-slate">Signed in as</p>
          <p className="text-sm font-semibold text-ink">{roleLabel}</p>
        </div>
        <div className="grid gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition active:scale-[0.98]",
                  isActive
                    ? "bg-forest text-white shadow-[0_8px_20px_rgba(15,61,51,0.15)]"
                    : "text-ink hover:bg-sand/70"
                )}
              >
                <span>{link.label}</span>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    isActive ? "text-gold" : "text-slate/50"
                  )}
                >
                  {link.icon}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="mt-4 border-t border-ink/10 pt-4">
          <Button variant="outline" className="w-full" onClick={logout}>
            Sign out
          </Button>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 lg:flex-row lg:gap-8 lg:px-8 lg:py-8">
        {/* Desktop Sidebar */}
        <aside className="hidden w-60 flex-shrink-0 lg:block">
          <div className="sticky top-8 space-y-5">
            <div className="rounded-[var(--radius-lg)] border border-ink/10 bg-white/90 p-5 shadow-[var(--shadow)] backdrop-blur">
              <Link href="/" className="flex items-center gap-3 transition hover:opacity-80">
                <Image
                  src="/logo.png"
                  alt="Majestic Tracking"
                  width={44}
                  height={44}
                  className="rounded-xl border border-ink/10 bg-white"
                />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate">Majestic</p>
                  <p className="text-lg font-semibold font-display">Tracking Ops</p>
                </div>
              </Link>
              <div className="mt-4 rounded-xl border border-ink/10 bg-sand/50 px-3 py-2 text-xs text-slate">
                Role: <span className="font-semibold text-ink">{roleLabel}</span>
              </div>
            </div>

            <nav className="space-y-1">
              {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-white text-ink shadow-[var(--shadow-sm)] ring-1 ring-gold/30"
                        : "text-slate hover:bg-white/70 hover:text-ink"
                    )}
                  >
                    <span>{link.label}</span>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider transition",
                        isActive ? "text-gold" : "text-slate/40 group-hover:text-slate/60"
                      )}
                    >
                      {link.icon}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <Button variant="outline" className="w-full" onClick={logout}>
              Sign out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 pb-8 lg:pb-0">{children}</main>
      </div>
    </div>
  );
}
