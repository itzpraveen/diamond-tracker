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
  mist: "#b7c2bc",
  danger: "#b42318"
};

function sumAgingBuckets(row: AgingBucketRow) {
  return row.bucket_0_2 + row.bucket_3_7 + row.bucket_8_15 + row.bucket_16_30 + row.bucket_30_plus;
}

function formatShortDate(value?: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short"
  }).format(new Date(value));
}

function formatStatusName(value: string) {
  return value
    .replace(/_/g, " ")
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

function KpiCard({
  label,
  value,
  caption,
  tone = "default"
}: {
  label: string;
  value: string | number;
  caption: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClasses =
    tone === "danger"
      ? "border-red-200/70 bg-red-50/70"
      : tone === "warning"
        ? "border-amber-200/70 bg-amber-50/70"
        : tone === "success"
          ? "border-emerald-200/70 bg-emerald-50/70"
          : "border-ink/8 bg-white/92";

  const accentClasses =
    tone === "danger"
      ? "text-red-700"
      : tone === "warning"
        ? "text-amber-700"
        : tone === "success"
          ? "text-emerald-700"
          : "text-forest";

  return (
    <Card className={`overflow-hidden border transition-shadow hover:shadow-[var(--shadow-lg)] ${toneClasses}`}>
      <CardLabel>{label}</CardLabel>
      <p className={`mt-3 text-3xl font-semibold font-display ${accentClasses}`}>{value}</p>
      <CardDescription className="mt-2">{caption}</CardDescription>
    </Card>
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
    queryFn: () => request<IncidentRow[]>("/incidents?status=OPEN")
  });

  const isRefreshing =
    agingQuery.isFetching ||
    turnaroundQuery.isFetching ||
    userActivityQuery.isFetching ||
    repairTargetsQuery.isFetching ||
    delaysQuery.isFetching ||
    factorySummaryQuery.isFetching ||
    incidentsQuery.isFetching;

  const refreshAll = async () => {
    await Promise.allSettled([
      agingQuery.refetch(),
      turnaroundQuery.refetch(),
      userActivityQuery.refetch(),
      repairTargetsQuery.refetch(),
      delaysQuery.refetch(),
      factorySummaryQuery.refetch(),
      incidentsQuery.refetch()
    ]);
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

  const stuckOver7Days = useMemo(
    () =>
      agingRows.reduce((total, row) => {
        if (row.status === "CANCELLED") return total;
        return total + row.bucket_8_15 + row.bucket_16_30 + row.bucket_30_plus;
      }, 0),
    [agingRows]
  );

  const atFactoryCount = useMemo(
    () => (factorySummaryQuery.data || []).reduce((total, row) => total + row.at_factory, 0),
    [factorySummaryQuery.data]
  );

  const returnedPendingCount = useMemo(
    () => (factorySummaryQuery.data || []).reduce((total, row) => total + row.returned_pending, 0),
    [factorySummaryQuery.data]
  );

  const attentionCount = repairTargets.overdue.length + delayedBatches.length + openIncidents.length;
  const lastUpdated = Math.max(
    agingQuery.dataUpdatedAt || 0,
    turnaroundQuery.dataUpdatedAt || 0,
    userActivityQuery.dataUpdatedAt || 0,
    repairTargetsQuery.dataUpdatedAt || 0,
    delaysQuery.dataUpdatedAt || 0,
    factorySummaryQuery.dataUpdatedAt || 0,
    incidentsQuery.dataUpdatedAt || 0
  );

  const leadCopy =
    attentionCount > 0
      ? `${attentionCount} records need review across overdue returns, delayed vouchers, and open incidents.`
      : "No immediate blockers detected across incidents, returns, and voucher delays.";

  return (
    <div className="space-y-6 animate-fadeUp">
      <Card variant="elevated" className="overflow-hidden">
        <div className="grid gap-5 lg:grid-cols-[1.45fr_0.85fr] lg:items-end">
          <div>
            <CardLabel>Operations Desk</CardLabel>
            <h1 className="mt-3 text-2xl font-semibold font-display sm:text-3xl">
              Live workflow pressure, not just charts.
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate sm:text-base">
              {leadCopy}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant={attentionCount > 0 ? "warning" : "success"}>{attentionCount} needs attention</Badge>
              <Badge variant="default">Last updated {formatLastUpdated(lastUpdated)}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/items">
              <Button>Review Items</Button>
            </Link>
            <Link href="/incidents">
              <Button variant="outline">Review Incidents</Button>
            </Link>
            <Link href="/batches">
              <Button variant="outline">Manage Vouchers</Button>
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
          value={openIncidents.length}
          caption="Exceptions that still need investigation or resolution."
          tone={openIncidents.length > 0 ? "danger" : "success"}
        />
        <KpiCard
          label="Overdue Returns"
          value={repairTargets.overdue.length}
          caption="Items whose target return date has already passed."
          tone={repairTargets.overdue.length > 0 ? "danger" : "success"}
        />
        <KpiCard
          label="Stuck Over 7 Days"
          value={stuckOver7Days}
          caption="Active items sitting too long without the next handoff."
          tone={stuckOver7Days > 0 ? "warning" : "success"}
        />
        <KpiCard
          label="Delayed Vouchers"
          value={delayedBatches.length}
          caption="Vouchers past expected return with factory handoff risk."
          tone={delayedBatches.length > 0 ? "warning" : "success"}
        />
        <KpiCard
          label="At Factory"
          value={atFactoryCount}
          caption="Items currently in the factory pipeline right now."
          tone="default"
        />
        <KpiCard
          label="Returned Pending"
          value={returnedPendingCount + repairTargets.uncollected.length}
          caption="Returned or ready items still waiting for closure."
          tone={returnedPendingCount + repairTargets.uncollected.length > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionCard
          label="Needs Attention"
          title="Overdue Returns"
          description="Oldest repair commitments that are already late."
          href="/items"
          hrefLabel="Open Items"
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
          description="Factory vouchers that have crossed their expected return date."
          href="/batches"
          hrefLabel="Open Vouchers"
        >
          {delaysQuery.isLoading ? (
            <LoadingPanel />
          ) : delayedBatches.length ? (
            <div className="space-y-3">
              {delayedBatches.slice(0, 5).map((batch) => (
                <Link
                  key={batch.batch_code}
                  href="/batches"
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
              description="Factory voucher return dates are currently on track."
            />
          )}
        </SectionCard>

        <SectionCard
          label="Needs Attention"
          title="Open Incidents"
          description="Recent exceptions that still need follow-up from operations."
          href="/incidents"
          hrefLabel="Open Incidents"
        >
          {incidentsQuery.isLoading ? (
            <LoadingPanel />
          ) : openIncidents.length ? (
            <div className="space-y-3">
              {openIncidents.slice(0, 5).map((incident) => (
                <Link
                  key={incident.id}
                  href="/incidents"
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
                <BarChart
                  data={turnaroundRows}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 25, bottom: 0 }}
                >
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

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          label="Factory Pressure"
          title="Factory Queue by Location"
          description="Where current factory load and returned-pending pressure is sitting."
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
      </div>
    </div>
  );
}
