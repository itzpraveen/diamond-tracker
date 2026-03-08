"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { useQuery } from "@tanstack/react-query";

import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardLabel, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";

type AgingBucketRow = {
  status: string;
  bucket_0_2: number;
  bucket_3_7: number;
  bucket_8_15: number;
  bucket_16_30: number;
  bucket_30_plus: number;
};

type TurnaroundRow = {
  stage: string;
  average_days: number;
};

type UserActivityRow = {
  user_id: string;
  username: string;
  scans: number;
};

type JobSummary = {
  job_id: string;
  customer_name?: string | null;
  current_status: string;
  target_return_date?: string | null;
  last_scan_at?: string | null;
  created_at: string;
  factory_name?: string | null;
};

type RepairTargets = {
  overdue: JobSummary[];
  approaching: JobSummary[];
  uncollected: JobSummary[];
};

type BatchDelayRow = {
  batch_code: string;
  expected_return_date?: string | null;
  dispatch_date?: string | null;
  delay_days: number;
};

type FactorySummaryRow = {
  factory_id: string;
  factory_name: string;
  at_factory: number;
  expected_from_factory: number;
  returned_pending: number;
  total_dispatched: number;
};

type IncidentRow = {
  id: string;
  type: string;
  status: string;
  description: string;
  created_at: string;
};

type AuditEventRow = {
  id: string;
  job_code?: string | null;
  from_status?: string | null;
  to_status: string;
  scanned_by_username?: string | null;
  scanned_by_role: string;
  timestamp: string;
  override_reason?: string | null;
};

type OpsDeltaMetric = {
  total: number;
  today: number;
  yesterday: number;
  delta: number;
};

type OpsSummaryRow = {
  attention_count: number;
  open_incidents: OpsDeltaMetric;
  overdue_returns: OpsDeltaMetric;
  aged_over_7: OpsDeltaMetric;
  delayed_vouchers: OpsDeltaMetric;
  aged_over_15: number;
  at_factory: number;
  received_at_factory: number;
  awaiting_closure: number;
  awaiting_closure_overdue: number;
};

const tooltipStyle = {
  backgroundColor: "rgba(255,255,255,0.96)",
  border: "1px solid rgba(16,23,20,0.1)",
  borderRadius: "14px",
  boxShadow: "0 12px 28px rgba(15,23,20,0.12)"
};

const chartColors = {
  forest: "#0f3d33",
  pine: "#2a6b5b",
  gold: "#d4a15c",
  sand: "#f0c27b",
  stone: "#7d8a84",
  mist: "#b7c2bc"
};

function sumAgingBuckets(row: AgingBucketRow) {
  return row.bucket_0_2 + row.bucket_3_7 + row.bucket_8_15 + row.bucket_16_30 + row.bucket_30_plus;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function formatShortDate(value?: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short"
  }).format(new Date(value));
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "Unknown";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Unknown";
  const deltaMs = Date.now() - timestamp;
  const minutes = Math.max(0, Math.floor(deltaMs / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatShortDate(value);
}

function formatStatusName(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/->/g, " -> ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatLastUpdated(timestamp?: number) {
  if (!timestamp) return "Waiting for live data";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function truncate(text: string, maxLength = 58) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function formatDelta(delta: number) {
  if (delta === 0) return "flat vs yesterday";
  return `${delta > 0 ? "+" : ""}${delta} vs yesterday`;
}

function formatDailyContext(today: number, delta: number, noun: string, zeroLabel: string) {
  if (today === 0 && delta === 0) return zeroLabel;
  return `${today} ${noun} today • ${formatDelta(delta)}`;
}

function KpiCard({
  label,
  value,
  caption,
  context,
  href,
  tone = "default"
}: {
  label: string;
  value: string | number;
  caption: string;
  context?: string;
  href?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const numericValue = typeof value === "number" ? value : Number(value);
  const isZero = typeof numericValue === "number" && !Number.isNaN(numericValue) && numericValue === 0;
  const toneClasses =
    isZero
      ? "border-ink/6 bg-white/72 shadow-none"
      : tone === "danger"
        ? "border-red-200/70 bg-red-50/70"
        : tone === "warning"
          ? "border-amber-200/70 bg-amber-50/70"
          : tone === "success"
            ? "border-emerald-200/70 bg-emerald-50/70"
            : "border-ink/8 bg-white/92";
  const accentClasses =
    isZero
      ? "text-slate"
      : tone === "danger"
        ? "text-red-700"
        : tone === "warning"
          ? "text-amber-700"
          : tone === "success"
            ? "text-emerald-700"
            : "text-forest";

  const body = (
    <Card
      className={cn(
        "h-full overflow-hidden border transition-all",
        toneClasses,
        href && "hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
      )}
    >
      <div className="flex h-full flex-col">
        <CardLabel className={isZero ? "text-slate/70" : undefined}>{label}</CardLabel>
        <p className={cn("mt-3 text-3xl font-semibold font-display", accentClasses)}>{value}</p>
        {context ? (
          <p className={cn("mt-1 text-xs font-medium", isZero ? "text-slate" : accentClasses)}>{context}</p>
        ) : null}
        <CardDescription className="mt-2">{caption}</CardDescription>
        {href ? <p className="mt-4 text-xs font-semibold text-forest">Open filtered list</p> : null}
      </div>
    </Card>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

function SectionCard({
  label,
  title,
  description,
  href,
  hrefLabel,
  children
}: {
  label: string;
  title: string;
  description: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardLabel>{label}</CardLabel>
          <CardTitle className="mt-2">{title}</CardTitle>
          <CardDescription className="mt-2">{description}</CardDescription>
        </div>
        {href && hrefLabel ? (
          <Link href={href} className="shrink-0">
            <Button variant="outline" size="sm">{hrefLabel}</Button>
          </Link>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function EmptyPanel({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink/10 bg-sand/30 px-6 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-slate">{description}</p>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="flex min-h-[160px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
    </div>
  );
}

export default function Dashboard() {
  const { request } = useApi();
  const { roles } = useAuth();

  const isAdmin = roles.includes("Admin");
  const canViewOps = isAdmin || roles.includes("Dispatch") || roles.includes("QC_Stock");
  const canViewFactory = isAdmin || roles.includes("Dispatch") || roles.includes("Factory");
  const canViewDelays = isAdmin || roles.includes("Dispatch");

  const agingQuery = useQuery({
    queryKey: ["reports", "aging"],
    queryFn: () => request<AgingBucketRow[]>("/reports/pending-aging"),
    enabled: canViewOps
  });

  const turnaroundQuery = useQuery({
    queryKey: ["reports", "turnaround"],
    queryFn: () => request<TurnaroundRow[]>("/reports/turnaround"),
    enabled: isAdmin
  });

  const userActivityQuery = useQuery({
    queryKey: ["reports", "user-activity"],
    queryFn: () => request<UserActivityRow[]>("/reports/user-activity"),
    enabled: isAdmin
  });

  const repairTargetsQuery = useQuery({
    queryKey: ["reports", "repair-targets"],
    queryFn: () => request<RepairTargets>("/reports/repair-targets"),
    enabled: canViewOps
  });

  const delaysQuery = useQuery({
    queryKey: ["reports", "batch-delays"],
    queryFn: () => request<BatchDelayRow[]>("/reports/batch-delays"),
    enabled: canViewDelays
  });

  const factorySummaryQuery = useQuery({
    queryKey: ["reports", "factory-summary"],
    queryFn: () => request<FactorySummaryRow[]>("/reports/factory-summary"),
    enabled: canViewFactory
  });

  const incidentsQuery = useQuery({
    queryKey: ["incidents", "open"],
    queryFn: () => request<IncidentRow[]>("/incidents?status=OPEN"),
    enabled: canViewOps
  });

  const recentActivityQuery = useQuery({
    queryKey: ["audit", "recent"],
    queryFn: () => request<AuditEventRow[]>("/audit/events?limit=6"),
    enabled: isAdmin
  });

  const opsSummaryQuery = useQuery({
    queryKey: ["reports", "ops-summary"],
    queryFn: () => request<OpsSummaryRow>("/reports/ops-summary"),
    enabled: canViewOps
  });

  const isRefreshing =
    agingQuery.isFetching ||
    turnaroundQuery.isFetching ||
    userActivityQuery.isFetching ||
    repairTargetsQuery.isFetching ||
    delaysQuery.isFetching ||
    factorySummaryQuery.isFetching ||
    incidentsQuery.isFetching ||
    recentActivityQuery.isFetching ||
    opsSummaryQuery.isFetching;

  const refreshAll = async () => {
    const refreshers: Array<Promise<unknown>> = [
      agingQuery.refetch(),
      opsSummaryQuery.refetch(),
      repairTargetsQuery.refetch(),
      incidentsQuery.refetch(),
      delaysQuery.refetch(),
      factorySummaryQuery.refetch()
    ];
    if (isAdmin) {
      refreshers.push(turnaroundQuery.refetch(), userActivityQuery.refetch(), recentActivityQuery.refetch());
    }
    await Promise.allSettled(refreshers);
  };

  const agingRows = useMemo(
    () =>
      (agingQuery.data || [])
        .map((row) => ({ ...row, total: sumAgingBuckets(row) }))
        .filter((row) => row.total > 0 && row.status !== "DELIVERED_TO_CUSTOMER")
        .sort((a, b) => b.total - a.total),
    [agingQuery.data]
  );

  const turnaroundRows = useMemo(
    () => (turnaroundQuery.data || []).filter((row) => row.average_days > 0),
    [turnaroundQuery.data]
  );

  const topUsers = useMemo(
    () => [...(userActivityQuery.data || [])].sort((a, b) => b.scans - a.scans).slice(0, 6),
    [userActivityQuery.data]
  );

  const delayedBatches = useMemo(
    () => (delaysQuery.data || []).filter((batch) => batch.delay_days > 0).sort((a, b) => b.delay_days - a.delay_days),
    [delaysQuery.data]
  );

  const factoryRows = useMemo(
    () =>
      [...(factorySummaryQuery.data || [])]
        .sort((a, b) => b.total_dispatched - a.total_dispatched)
        .slice(0, 6),
    [factorySummaryQuery.data]
  );

  const repairTargets = repairTargetsQuery.data || { overdue: [], approaching: [], uncollected: [] };
  const openIncidents = incidentsQuery.data || [];
  const recentActivity = recentActivityQuery.data || [];
  const opsSummary = opsSummaryQuery.data;

  const stuckOver7Days = useMemo(
    () =>
      agingRows.reduce((total, row) => {
        if (row.status === "CANCELLED") return total;
        return total + row.bucket_8_15 + row.bucket_16_30 + row.bucket_30_plus;
      }, 0),
    [agingRows]
  );
  const derivedAgedOver15Days = useMemo(
    () =>
      agingRows.reduce((total, row) => {
        if (row.status === "CANCELLED") return total;
        return total + row.bucket_16_30 + row.bucket_30_plus;
      }, 0),
    [agingRows]
  );
  const derivedAtFactoryCount = useMemo(
    () => (factorySummaryQuery.data || []).reduce((total, row) => total + row.at_factory, 0),
    [factorySummaryQuery.data]
  );
  const derivedReceivedAtFactoryCount = useMemo(
    () => (factorySummaryQuery.data || []).reduce((total, row) => total + row.expected_from_factory, 0),
    [factorySummaryQuery.data]
  );
  const derivedAwaitingClosureCount = useMemo(
    () =>
      (factorySummaryQuery.data || []).reduce((total, row) => total + row.returned_pending, 0) +
      repairTargets.uncollected.length,
    [factorySummaryQuery.data, repairTargets.uncollected.length]
  );

  const openIncidentCount = opsSummary?.open_incidents.total ?? openIncidents.length;
  const overdueCount = opsSummary?.overdue_returns.total ?? repairTargets.overdue.length;
  const delayedVoucherCount = opsSummary?.delayed_vouchers.total ?? delayedBatches.length;
  const attentionCount = opsSummary?.attention_count ?? (overdueCount + delayedVoucherCount + openIncidentCount);
  const agedOver15Days = opsSummary?.aged_over_15 ?? derivedAgedOver15Days;
  const stuckOver7DaysCount = opsSummary?.aged_over_7.total ?? stuckOver7Days;
  const atFactoryCount = opsSummary?.at_factory ?? derivedAtFactoryCount;
  const expectedFromFactoryCount = opsSummary?.received_at_factory ?? derivedReceivedAtFactoryCount;
  const awaitingClosureCount = opsSummary?.awaiting_closure ?? derivedAwaitingClosureCount;
  const awaitingClosureOverdueCount = opsSummary?.awaiting_closure_overdue ?? repairTargets.uncollected.length;

  const openIncidentsContext = opsSummary
    ? formatDailyContext(opsSummary.open_incidents.today, opsSummary.open_incidents.delta, "opened", "No new incidents today")
    : "Live summary unavailable";
  const overdueContext = opsSummary
    ? formatDailyContext(
        opsSummary.overdue_returns.today,
        opsSummary.overdue_returns.delta,
        "crossed target",
        "No new overdue returns today"
      )
    : "Live summary unavailable";
  const agedContext = opsSummary
    ? formatDailyContext(
        opsSummary.aged_over_7.today,
        opsSummary.aged_over_7.delta,
        "crossed 7 days",
        "No new 7-day aging today"
      )
    : `${agedOver15Days} aged beyond 15 days`;
  const delayedContext = opsSummary
    ? formatDailyContext(
        opsSummary.delayed_vouchers.today,
        opsSummary.delayed_vouchers.delta,
        "crossed SLA",
        "No new voucher delays today"
      )
    : "Live summary unavailable";

  const lastUpdated = Math.max(
    agingQuery.dataUpdatedAt || 0,
    turnaroundQuery.dataUpdatedAt || 0,
    userActivityQuery.dataUpdatedAt || 0,
    repairTargetsQuery.dataUpdatedAt || 0,
    delaysQuery.dataUpdatedAt || 0,
    factorySummaryQuery.dataUpdatedAt || 0,
    incidentsQuery.dataUpdatedAt || 0,
    recentActivityQuery.dataUpdatedAt || 0,
    opsSummaryQuery.dataUpdatedAt || 0
  );

  const summaryParts = [
    overdueCount ? `${overdueCount} overdue ${pluralize(overdueCount, "return")}` : null,
    delayedVoucherCount ? `${delayedVoucherCount} delayed ${pluralize(delayedVoucherCount, "voucher")}` : null,
    openIncidentCount ? `${openIncidentCount} open ${pluralize(openIncidentCount, "incident")}` : null
  ].filter(Boolean) as string[];

  const headline =
    overdueCount > 0
      ? `${overdueCount} Overdue ${pluralize(overdueCount, "Return")} Need Review`
      : attentionCount > 0
        ? `${attentionCount} Records Need Action`
        : "No Immediate Exceptions";

  const summaryLine =
    attentionCount > 0
      ? `${summaryParts.join(", ")}.`
      : "Overdue returns, voucher delays, and incidents are currently clear.";

  const secondaryLine =
    attentionCount > 0 || stuckOver7DaysCount > 0 || atFactoryCount > 0
      ? `${stuckOver7DaysCount} ${pluralize(stuckOver7DaysCount, "item")} aged over 7 days. ${atFactoryCount} currently at factory.`
      : "Factory queue and aging pressure are within normal range.";

  const primaryAction =
    overdueCount > 0
      ? { href: "/items?attention=overdue_returns", label: "Review Overdue Returns" }
      : { href: "/items?attention=at_factory", label: "Open Factory Queue" };
  const voucherAction =
    delayedVoucherCount > 0
      ? { href: "/batches?delayed=true", label: "Review Delayed Vouchers" }
      : { href: "/batches", label: "Manage Vouchers" };

  return (
    <div className="space-y-6 animate-fadeUp">
      <Card variant="elevated" className="overflow-hidden">
        <div className="grid gap-5 lg:grid-cols-[1.45fr_0.9fr] lg:items-end">
          <div>
            <CardLabel>Attention Summary</CardLabel>
            <h1 className="mt-3 text-2xl font-semibold font-display sm:text-3xl">{headline}</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate sm:text-base">{summaryLine}</p>
            <p className="mt-2 max-w-3xl text-sm text-slate">{secondaryLine}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant={attentionCount > 0 ? "warning" : "success"}>{attentionCount} needing action</Badge>
              <Badge variant="default">Last updated {formatLastUpdated(lastUpdated)}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href={primaryAction.href}>
              <Button>{primaryAction.label}</Button>
            </Link>
            <Link href="/incidents?status=OPEN">
              <Button variant="outline">Review Incidents</Button>
            </Link>
            <Link href={voucherAction.href}>
              <Button variant="outline">{voucherAction.label}</Button>
            </Link>
            <Button variant="ghost" onClick={() => void refreshAll()} disabled={isRefreshing}>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Open Incidents"
          value={openIncidentCount}
          context={openIncidentsContext}
          caption="Exceptions still waiting for investigation or resolution."
          tone={openIncidentCount > 0 ? "danger" : "success"}
          href="/incidents?status=OPEN"
        />
        <KpiCard
          label="Overdue Returns"
          value={overdueCount}
          context={overdueContext}
          caption="Items already past target return date and not yet closed."
          tone={overdueCount > 0 ? "danger" : "success"}
          href="/items?attention=overdue_returns"
        />
        <KpiCard
          label="Aged > 7 Days"
          value={stuckOver7DaysCount}
          context={agedContext}
          caption="Active items sitting too long without the next handoff."
          tone={stuckOver7DaysCount > 0 ? "warning" : "success"}
          href="/items?attention=aged_over_7"
        />
        <KpiCard
          label="Delayed Vouchers"
          value={delayedVoucherCount}
          context={delayedContext}
          caption="Vouchers whose expected return date has already passed."
          tone={delayedVoucherCount > 0 ? "warning" : "success"}
          href="/batches?delayed=true"
        />
        <KpiCard
          label="Currently At Factory"
          value={atFactoryCount}
          context={expectedFromFactoryCount ? `${expectedFromFactoryCount} already received at factory` : "No items received at factory yet"}
          caption="Items still moving through the factory pipeline."
          tone={atFactoryCount > 0 ? "default" : "success"}
          href="/items?attention=at_factory"
        />
        <KpiCard
          label="Awaiting Closure"
          value={awaitingClosureCount}
          context={awaitingClosureOverdueCount ? `${awaitingClosureOverdueCount} already past target date` : "No post-return aging detected"}
          caption="Returned or ready items still waiting for the final closure step."
          tone={awaitingClosureCount > 0 ? "warning" : "success"}
          href="/items?attention=awaiting_closure"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionCard
          label="Needs Attention"
          title="Overdue Returns"
          description="Oldest repair commitments that are already late."
          href="/items?attention=overdue_returns"
          hrefLabel="Review Overdue Returns"
        >
          {repairTargetsQuery.isLoading ? (
            <LoadingPanel />
          ) : repairTargets.overdue.length ? (
            <div className="space-y-3">
              {repairTargets.overdue.slice(0, 5).map((job) => {
                const overdueDays = Math.max(
                  1,
                  Math.floor((Date.now() - new Date(job.target_return_date || job.created_at).getTime()) / 86400000)
                );
                return (
                  <Link
                    key={job.job_id}
                    href={`/items/${job.job_id}`}
                    className="block rounded-2xl border border-ink/8 bg-sand/30 p-3 transition hover:border-ink/16 hover:bg-sand/45"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{job.job_id}</p>
                        <p className="mt-1 text-xs text-slate">
                          {job.factory_name || "Factory pending"} · {job.customer_name || "Walk-in customer"}
                        </p>
                      </div>
                      <Badge variant="danger" size="sm">{overdueDays}d late</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={job.current_status} size="sm" />
                      <span className="text-xs text-slate">Due {formatShortDate(job.target_return_date)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyPanel
              title="No overdue returns"
              description="Repair commitments are currently within target dates."
            />
          )}
        </SectionCard>

        <SectionCard
          label="Needs Attention"
          title="Delayed Vouchers"
          description="Factory vouchers that have crossed expected return date."
          href="/batches?delayed=true"
          hrefLabel="Open Delayed Vouchers"
        >
          {delaysQuery.isLoading ? (
            <LoadingPanel />
          ) : delayedBatches.length ? (
            <div className="space-y-3">
              {delayedBatches.slice(0, 5).map((batch) => (
                <Link
                  key={batch.batch_code}
                  href="/batches?delayed=true"
                  className="block rounded-2xl border border-ink/8 bg-white/70 p-3 transition hover:border-ink/16 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{batch.batch_code}</p>
                      <p className="mt-1 text-xs text-slate">
                        Expected {formatShortDate(batch.expected_return_date)} · dispatched {formatShortDate(batch.dispatch_date)}
                      </p>
                    </div>
                    <Badge variant="warning" size="sm">{batch.delay_days}d late</Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="No delayed vouchers"
              description="Voucher return dates are currently on track."
            />
          )}
        </SectionCard>

        <SectionCard
          label="Needs Attention"
          title="Open Incidents"
          description="Recent exceptions that still need follow-up from operations."
          href="/incidents?status=OPEN"
          hrefLabel="Open Incidents"
        >
          {incidentsQuery.isLoading ? (
            <LoadingPanel />
          ) : openIncidents.length ? (
            <div className="space-y-3">
              {openIncidents.slice(0, 5).map((incident) => (
                <Link
                  key={incident.id}
                  href="/incidents?status=OPEN"
                  className="block rounded-2xl border border-ink/8 bg-red-50/40 p-3 transition hover:border-red-200 hover:bg-red-50/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{incident.type}</p>
                      <p className="mt-1 text-xs text-slate">{truncate(incident.description)}</p>
                    </div>
                    <Badge variant="danger" size="sm">Open</Badge>
                  </div>
                  <p className="mt-3 text-xs text-slate">Raised {formatShortDate(incident.created_at)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="No open incidents"
              description="There are no unresolved discrepancies at the moment."
            />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          label="Workflow Bottlenecks"
          title="Pending Aging Buckets"
          description="Which statuses are accumulating age instead of moving forward."
        >
          {agingQuery.isLoading ? (
            <LoadingPanel />
          ) : agingRows.length ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingRows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,23,20,0.08)" />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 11, fill: chartColors.stone }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(16,23,20,0.1)" }}
                    tickFormatter={(value) => formatStatusName(value)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: chartColors.stone }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, "Items"]} />
                  <Bar dataKey="bucket_0_2" name="0-2 days" stackId="a" fill={chartColors.forest} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bucket_3_7" name="3-7 days" stackId="a" fill={chartColors.pine} />
                  <Bar dataKey="bucket_8_15" name="8-15 days" stackId="a" fill={chartColors.gold} />
                  <Bar dataKey="bucket_16_30" name="16-30 days" stackId="a" fill={chartColors.sand} />
                  <Bar dataKey="bucket_30_plus" name="30+ days" stackId="a" fill={chartColors.stone} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyPanel
              title="No aging data available"
              description="Once items move through the workflow, bucket pressure will appear here."
            />
          )}
        </SectionCard>

        <SectionCard
          label="Turnaround"
          title="Turnaround by Stage"
          description="Average days spent between major handoff points."
        >
          {turnaroundQuery.isLoading ? (
            <LoadingPanel />
          ) : turnaroundRows.length ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnaroundRows} layout="vertical" margin={{ top: 10, right: 20, left: 25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,23,20,0.08)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: chartColors.stone }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    width={132}
                    tick={{ fontSize: 11, fill: chartColors.stone }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} days`, "Average"]} />
                  <Bar dataKey="average_days" radius={[0, 8, 8, 0]}>
                    {turnaroundRows.map((row, index) => (
                      <Cell
                        key={row.stage}
                        fill={index === 0 ? chartColors.gold : index % 2 === 0 ? chartColors.forest : chartColors.pine}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyPanel
              title="Turnaround data is still building"
              description="Stage averages appear after enough scan history accumulates."
            />
          )}
        </SectionCard>
      </div>

      <div className={cn("grid gap-5", isAdmin ? "xl:grid-cols-2" : "xl:grid-cols-1")}>
        <SectionCard
          label="Factory Pressure"
          title="Factory Queue by Location"
          description="Where current factory load and return pressure is sitting."
        >
          {factorySummaryQuery.isLoading ? (
            <LoadingPanel />
          ) : factoryRows.length ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={factoryRows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,23,20,0.08)" />
                  <XAxis
                    dataKey="factory_name"
                    tick={{ fontSize: 11, fill: chartColors.stone }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(16,23,20,0.1)" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: chartColors.stone }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="at_factory" name="At factory" fill={chartColors.forest} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returned_pending" name="Returned pending" fill={chartColors.gold} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyPanel
              title="No factory load to display"
              description="Factory queues will show once vouchers are actively moving."
            />
          )}
        </SectionCard>

        {isAdmin ? (
          <SectionCard
            label="Recent Activity"
            title="Latest Workflow Events"
            description="The most recent chain-of-custody changes from the live floor."
            href="/audit"
            hrefLabel="Open Audit Log"
          >
            {recentActivityQuery.isLoading ? (
              <LoadingPanel />
            ) : recentActivity.length ? (
              <div className="space-y-3">
                {recentActivity.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-ink/8 bg-white/80 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{event.job_code || "Item event"}</p>
                        <p className="mt-1 text-xs text-slate">
                          {event.from_status ? formatStatusName(event.from_status) : "Created"}{" -> "}{formatStatusName(event.to_status)}
                        </p>
                      </div>
                      <Badge variant={event.override_reason ? "warning" : "default"} size="sm">
                        {event.override_reason ? "Override" : formatRelativeTime(event.timestamp)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate">
                      <span>{event.scanned_by_username || event.scanned_by_role}</span>
                      <span>•</span>
                      <span>{formatDateTime(event.timestamp)}</span>
                    </div>
                    {event.override_reason ? (
                      <p className="mt-2 text-xs text-amber-700">Reason: {event.override_reason}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel
                title="No recent activity"
                description="Recent scan and handoff activity will appear here."
              />
            )}
          </SectionCard>
        ) : null}
      </div>

      {isAdmin ? (
        <SectionCard
          label="User Activity"
          title="Top Scanners"
          description="Who is moving the most items through the system right now."
        >
          {userActivityQuery.isLoading ? (
            <LoadingPanel />
          ) : topUsers.length ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topUsers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,23,20,0.08)" />
                  <XAxis
                    dataKey="username"
                    tick={{ fontSize: 11, fill: chartColors.stone }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(16,23,20,0.1)" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: chartColors.stone }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, "Scans"]} />
                  <Bar dataKey="scans" radius={[8, 8, 0, 0]}>
                    {topUsers.map((user, index) => (
                      <Cell
                        key={user.user_id}
                        fill={index === 0 ? chartColors.forest : index === 1 ? chartColors.pine : chartColors.mist}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyPanel
              title="No scan activity yet"
              description="Scanner activity will appear after operators start processing items."
            />
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}
