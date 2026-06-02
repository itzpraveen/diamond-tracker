"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";

import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardLabel, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const routeRows = [
  {
    route: "Issue to Factory",
    path: "Present Location -> Factory",
    expected: "PACKED_READY",
    target: "DISPATCHED_TO_FACTORY"
  },
  {
    route: "Receive at Factory",
    path: "Present Location -> Factory",
    expected: "DISPATCHED_TO_FACTORY",
    target: "RECEIVED_AT_FACTORY"
  },
  {
    route: "Receive from Factory",
    path: "Factory -> Present Location",
    expected: "DISPATCHED_TO_FACTORY, RECEIVED_AT_FACTORY, or RETURNED_FROM_FACTORY",
    target: "RECEIVED_AT_SHOP"
  },
  {
    route: "QC to Stock",
    path: "Quality Control -> Stock",
    expected: "RECEIVED_AT_SHOP",
    target: "ADDED_TO_STOCK"
  },
  {
    route: "QC to Delivery",
    path: "Quality Control -> Delivery",
    expected: "RECEIVED_AT_SHOP or ADDED_TO_STOCK",
    target: "HANDED_TO_DELIVERY"
  }
];

const roleGuides = [
  {
    role: "Purchase",
    work: "Create item, enter item details/photos, and print the label.",
    status: "PURCHASED"
  },
  {
    role: "Packing",
    work: "Verify label and cover, then mark item ready for movement.",
    status: "PACKED_READY"
  },
  {
    role: "Dispatch",
    work: "Create Issue to Factory voucher, scan packed items, set expected return date, and issue voucher.",
    status: "DISPATCHED_TO_FACTORY"
  },
  {
    role: "Factory",
    work: "Confirm receipt using Receive at Factory voucher.",
    status: "RECEIVED_AT_FACTORY"
  },
  {
    role: "QC / Stock",
    work: "Receive factory returns, then move items to stock or delivery.",
    status: "RECEIVED_AT_SHOP / ADDED_TO_STOCK / HANDED_TO_DELIVERY"
  },
  {
    role: "Delivery",
    work: "Confirm final handover to customer.",
    status: "DELIVERED_TO_CUSTOMER"
  }
];

const troubleshooting = [
  {
    problem: "Item is not at expected status",
    fix: "Open the item detail and check Item Journey. Process the missing previous route first."
  },
  {
    problem: "Voucher factory does not match",
    fix: "Check the item factory and voucher factory. Use the correct factory voucher before scanning again."
  },
  {
    problem: "Item already in voucher",
    fix: "Open the voucher and check the item list. The item was already scanned into that voucher."
  },
  {
    problem: "Voucher has no items",
    fix: "Open the voucher and scan items into it before processing."
  },
  {
    problem: "Factory id required",
    fix: "Select a factory when creating the voucher or before scanning items into a factory route."
  }
];

const taskHelp = [
  {
    title: "Create a new item",
    keywords: "purchase create job label photo item",
    steps: ["Open Items", "Create the item", "Enter details and photos", "Download or print the label"],
    href: "/items"
  },
  {
    title: "Issue items to factory",
    keywords: "dispatch issue factory voucher packed ready",
    steps: ["Open Vouchers", "Create Issue to Factory", "Select factory", "Scan PACKED_READY items", "Issue voucher"],
    href: "/batches"
  },
  {
    title: "Factory receive",
    keywords: "factory receive at factory received factory receipt",
    steps: ["Open Vouchers", "Create Receive at Factory", "Select factory", "Scan issued items", "Process voucher"],
    href: "/batches"
  },
  {
    title: "Receive from factory",
    keywords: "qc receive from factory present location returned shop",
    steps: ["Open Vouchers", "Create Receive from Factory", "Select factory", "Scan returned items", "Process voucher"],
    href: "/batches"
  },
  {
    title: "Move QC item to stock",
    keywords: "qc stock storage added to stock",
    steps: ["Open Vouchers", "Create QC to Stock", "Scan RECEIVED_AT_SHOP items", "Process voucher"],
    href: "/batches"
  },
  {
    title: "Hand item to delivery",
    keywords: "delivery handover qc delivery customer",
    steps: ["Open Vouchers", "Create QC to Delivery", "Scan received or stock items", "Process voucher"],
    href: "/batches"
  },
  {
    title: "Report a problem",
    keywords: "incident mismatch damage missing duplicate wrong cover",
    steps: ["Open Incidents or item detail", "Create incident", "Describe the issue clearly", "Resolve after verification"],
    href: "/incidents"
  },
  {
    title: "Understand an item status",
    keywords: "item journey status holder scan history chain custody",
    steps: ["Open Items", "Search job ID", "Open item detail", "Read Item Journey and Latest scans"],
    href: "/items"
  }
];

function Section({
  id,
  title,
  description,
  children
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <Card className="space-y-5">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-2">{description}</CardDescription>
        </div>
        {children}
      </Card>
    </section>
  );
}

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const filteredTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return taskHelp;
    return taskHelp.filter((task) => {
      const searchable = `${task.title} ${task.keywords} ${task.steps.join(" ")}`.toLowerCase();
      return searchable.includes(normalized);
    });
  }, [query]);

  return (
    <AppShell>
      <div className="space-y-6 animate-fadeUp">
        <Card variant="elevated" className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardLabel>Help</CardLabel>
              <h1 className="mt-3 text-2xl font-semibold font-display sm:text-3xl">How to use Diamond Tracker</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate sm:text-base">
                Use this page for daily operations, voucher routes, role responsibilities, and common error messages.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/batches">
                <Button>Open Vouchers</Button>
              </Link>
              <Link href="/items">
                <Button variant="outline">Open Items</Button>
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-ink/8 pt-4">
            {[
              ["Daily workflow", "daily-workflow"],
              ["Voucher routes", "voucher-routes"],
              ["Roles", "roles"],
              ["Troubleshooting", "troubleshooting"]
            ].map(([label, href]) => (
              <a
                key={href}
                href={`#${href}`}
                className="rounded-full border border-ink/10 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate transition hover:border-ink/20 hover:text-ink"
              >
                {label}
              </a>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardLabel>Find A Task</CardLabel>
              <CardTitle className="mt-2">Search common workflows</CardTitle>
              <CardDescription className="mt-2">
                Type what the staff member is trying to do, then open the right screen.
              </CardDescription>
            </div>
            <div className="w-full lg:max-w-sm">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search factory receive, incident, label..."
                autoComplete="off"
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {filteredTasks.map((task) => (
              <Link
                key={task.title}
                href={task.href}
                className="group rounded-2xl border border-ink/8 bg-white/78 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[var(--shadow-sm)]"
              >
                <p className="text-sm font-semibold text-ink">{task.title}</p>
                <ol className="mt-3 space-y-2">
                  {task.steps.map((step, index) => (
                    <li key={step} className="grid grid-cols-[1.35rem_1fr] gap-2 text-xs leading-5 text-slate">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-ink/10 bg-sand/40 text-[10px] font-semibold text-ink">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-xs font-semibold text-forest opacity-80 transition group-hover:opacity-100">Open screen</p>
              </Link>
            ))}
          </div>
          {!filteredTasks.length ? (
            <div className="rounded-2xl border border-dashed border-ink/10 bg-sand/25 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-ink">No matching workflow</p>
              <p className="mt-1 text-xs text-slate">Try searching for voucher, factory, stock, delivery, incident, or label.</p>
            </div>
          ) : null}
        </Card>

        <Section
          id="daily-workflow"
          title="Daily workflow"
          description="Start from Dashboard and clear exceptions before normal movement work."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-red-200/70 bg-red-50/70 p-4">
              <p className="text-sm font-semibold text-ink">1. Resolve incidents</p>
              <p className="mt-2 text-xs leading-5 text-slate">Open mismatches, missing items, duplicate scans, damage, or other issues first.</p>
            </div>
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4">
              <p className="text-sm font-semibold text-ink">2. Follow up factory</p>
              <p className="mt-2 text-xs leading-5 text-slate">Check delayed vouchers and items currently at factory.</p>
            </div>
            <div className="rounded-2xl border border-ink/8 bg-sand/30 p-4">
              <p className="text-sm font-semibold text-ink">3. Receive returns</p>
              <p className="mt-2 text-xs leading-5 text-slate">Factory receive for QC is in Vouchers: create Receive from Factory.</p>
            </div>
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4">
              <p className="text-sm font-semibold text-ink">4. Close QC work</p>
              <p className="mt-2 text-xs leading-5 text-slate">Move received items to stock or delivery and complete final handovers.</p>
            </div>
          </div>
        </Section>

        <Section
          id="voucher-routes"
          title="Voucher routes"
          description="Create the correct route once. When processing, scan or enter the voucher code and the system uses the saved route automatically."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.2em] text-slate">
                  <th className="border-b border-ink/10 px-3 py-2">Route</th>
                  <th className="border-b border-ink/10 px-3 py-2">Path</th>
                  <th className="border-b border-ink/10 px-3 py-2">Expected before processing</th>
                  <th className="border-b border-ink/10 px-3 py-2">Target status</th>
                </tr>
              </thead>
              <tbody>
                {routeRows.map((row) => (
                  <tr key={row.route} className="align-top">
                    <td className="border-b border-ink/6 px-3 py-3 font-semibold text-ink">{row.route}</td>
                    <td className="border-b border-ink/6 px-3 py-3 text-slate">{row.path}</td>
                    <td className="border-b border-ink/6 px-3 py-3 text-slate">{row.expected}</td>
                    <td className="border-b border-ink/6 px-3 py-3">
                      <Badge>{row.target}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          id="roles"
          title="Role guide"
          description="Each role should only move items through its part of the chain."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {roleGuides.map((guide) => (
              <div key={guide.role} className="rounded-2xl border border-ink/8 bg-white/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">{guide.role}</p>
                  <Badge size="sm">{guide.status}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate">{guide.work}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="troubleshooting"
          title="Troubleshooting"
          description="Use these checks before asking an admin to override an item."
        >
          <div className="space-y-3">
            {troubleshooting.map((item) => (
              <div key={item.problem} className="rounded-2xl border border-ink/8 bg-sand/25 p-4">
                <p className="text-sm font-semibold text-ink">{item.problem}</p>
                <p className="mt-2 text-sm text-slate">{item.fix}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
