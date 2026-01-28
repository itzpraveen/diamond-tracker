"use client";

import { useMemo, useState } from "react";

import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getApiBaseUrl } from "@/lib/apiBase";
import { statusLabel } from "@/lib/status";
import { useApi } from "@/lib/useApi";
import { useQuery } from "@tanstack/react-query";

export default function ReportsPage() {
  const { request } = useApi();
  const [windowDays, setWindowDays] = useState("3");
  const [showAllBatches, setShowAllBatches] = useState(false);
  const delaysQuery = useQuery({
    queryKey: ["reports", "batch-delays"],
    queryFn: () => request<any[]>("/reports/batch-delays")
  });
  const windowDaysValue = useMemo(() => {
    const parsed = Number(windowDays);
    if (Number.isNaN(parsed) || parsed < 1) return 3;
    return Math.min(parsed, 30);
  }, [windowDays]);
  const repairTargetsQuery = useQuery({
    queryKey: ["reports", "repair-targets", windowDaysValue],
    queryFn: () => request<any>(`/reports/repair-targets?window_days=${windowDaysValue}`)
  });

  const exportCsv = (type: string) => {
    const base = getApiBaseUrl();
    window.open(`${base}/reports/export.csv?type=${type}`, "_blank");
  };

  const refreshAll = () => {
    delaysQuery.refetch();
    repairTargetsQuery.refetch();
  };

  const formatDueWindow = (target?: string | null) => {
    if (!target) return "-";
    const targetDate = new Date(target);
    if (Number.isNaN(targetDate.getTime())) return "-";
    const diffMs = targetDate.getTime() - Date.now();
    if (diffMs >= 0) {
      const daysLeft = Math.ceil(diffMs / 86400000);
      return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
    }
    const overdueDays = Math.ceil(Math.abs(diffMs) / 86400000);
    return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`;
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString();
  };

  const delays = delaysQuery.data || [];
  const delayedBatches = delays.filter((batch) => (batch.delay_days ?? 0) > 0);
  const visibleBatches = showAllBatches ? delays : delayedBatches;
  const totalDelayDays = delayedBatches.reduce(
    (sum, batch) => sum + (Number(batch.delay_days) || 0),
    0
  );
  const avgDelay =
    delayedBatches.length > 0 ? (totalDelayDays / delayedBatches.length).toFixed(1) : "0";

  const lastUpdatedAt = Math.max(delaysQuery.dataUpdatedAt || 0, repairTargetsQuery.dataUpdatedAt || 0);
  const lastUpdatedLabel = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : "—";
  const hasError = delaysQuery.isError || repairTargetsQuery.isError;
  const delaysError =
    delaysQuery.error instanceof Error ? delaysQuery.error.message : "Failed to load batch delays.";
  const repairError =
    repairTargetsQuery.error instanceof Error ? repairTargetsQuery.error.message : "Failed to load repair targets.";

  const repairTargets = repairTargetsQuery.data;
  const repairCounts = {
    overdue: repairTargets?.overdue?.length ?? 0,
    approaching: repairTargets?.approaching?.length ?? 0,
    uncollected: repairTargets?.uncollected?.length ?? 0
  };
  const renderCount = (count: number) => (repairTargetsQuery.isLoading ? "—" : count);

  return (
    <AppShell>
      <Card className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate">Reports</p>
            <h1 className="text-2xl font-semibold font-display">Exports & Delays</h1>
            <p className="mt-2 text-sm text-slate">Generate CSV exports or review delayed batches.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-white/70 p-2">
            <Badge variant="info" size="sm">Live</Badge>
            <span className="text-xs text-slate-600">Last updated {lastUpdatedLabel}</span>
            <Button variant="outline" onClick={() => exportCsv("jobs")}>Export Jobs</Button>
            <Button variant="outline" onClick={() => exportCsv("batches")}>Export Batches</Button>
            <Button variant="outline" onClick={() => exportCsv("incidents")}>Export Incidents</Button>
            <Button variant="ghost" onClick={refreshAll} disabled={delaysQuery.isFetching || repairTargetsQuery.isFetching}>
              {delaysQuery.isFetching || repairTargetsQuery.isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {hasError && (
          <div className="rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700">
            <p className="font-semibold">Report data could not be loaded.</p>
            <p className="mt-1">{delaysQuery.isError ? delaysError : repairError}</p>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-ink/10 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate">Batches</p>
            <p className="mt-2 text-2xl font-semibold">{delays.length}</p>
            <p className="text-sm text-slate">Total batches tracked</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-600">Delayed</p>
            <p className="mt-2 text-2xl font-semibold">{delayedBatches.length}</p>
            <p className="text-sm text-amber-700">Batches past expected return</p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-600">Avg Delay</p>
            <p className="mt-2 text-2xl font-semibold">{avgDelay} days</p>
            <p className="text-sm text-sky-700">Average delay for delayed batches</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate">
            Showing {showAllBatches ? "all batches" : "delayed batches only"}.
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowAllBatches((prev) => !prev)}
          >
            {showAllBatches ? "Show Delayed Only" : "Show All Batches"}
          </Button>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Batch</TH>
              <TH>Expected Return</TH>
              <TH>Dispatch</TH>
              <TH>Delay (days)</TH>
            </TR>
          </THead>
          <TBody>
            {delaysQuery.isLoading ? (
              <TR>
                <TD colSpan={4}>
                  <div className="h-10 animate-pulse rounded-xl bg-sand/70" />
                </TD>
              </TR>
            ) : visibleBatches.length ? (
              visibleBatches.map((batch) => (
                <TR key={batch.batch_code}>
                  <TD>{batch.batch_code}</TD>
                  <TD>{formatDate(batch.expected_return_date)}</TD>
                  <TD>{formatDate(batch.dispatch_date)}</TD>
                  <TD>
                    <Badge variant={batch.delay_days > 0 ? "danger" : "default"} size="sm">
                      {batch.delay_days ?? 0}
                    </Badge>
                  </TD>
                </TR>
              ))
            ) : (
              <TR>
                <TD colSpan={4}>
                  <p className="text-sm text-slate">
                    No batches match this view. Try “Show All Batches” or adjust expected return dates.
                  </p>
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </Card>

      <Card className="mt-6 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate">Repair Targets</p>
            <h2 className="text-xl font-semibold font-display">Deadline Tracking</h2>
            <p className="mt-2 text-sm text-slate">
              Track overdue repairs, upcoming deadlines, and items waiting for collection.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-ink/10 bg-white/70 p-2">
            <label className="text-xs text-slate-600">Approaching window (days)</label>
            <Input
              type="number"
              min={1}
              max={30}
              className="w-24"
              value={windowDays}
              onChange={(event) => setWindowDays(event.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Only items with a target return date within this window (or overdue) are shown. Increase the window to include
          more upcoming work.
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-red-500">Overdue</p>
            <p className="mt-2 text-2xl font-semibold">{renderCount(repairCounts.overdue)}</p>
            <p className="text-sm text-red-700">Not back from repair</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-600">Approaching</p>
            <p className="mt-2 text-2xl font-semibold">{renderCount(repairCounts.approaching)}</p>
            <p className="text-sm text-amber-700">Due within {windowDaysValue} days</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Uncollected</p>
            <p className="mt-2 text-2xl font-semibold">{renderCount(repairCounts.uncollected)}</p>
            <p className="text-sm text-emerald-700">Returned, waiting on customer</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-red-700">Overdue Repairs</p>
              <p className="text-xs text-slate-500">{renderCount(repairCounts.overdue)} items</p>
            </div>
            {repairTargetsQuery.isLoading ? (
              <div className="h-12 animate-pulse rounded-xl bg-sand/70" />
            ) : repairCounts.overdue ? (
              <Table>
                <THead>
                  <TR>
                    <TH>Job ID</TH>
                    <TH>Customer</TH>
                    <TH>Repair Type</TH>
                    <TH>Factory</TH>
                    <TH>Target Return</TH>
                    <TH>Due</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {repairTargets?.overdue?.map((job: any) => (
                    <TR key={`overdue-${job.job_id}`}>
                      <TD>{job.job_id}</TD>
                      <TD>
                        <div>
                          <div className="font-medium">{job.customer_name || "-"}</div>
                          <div className="text-xs text-slate-500">{job.customer_phone || "-"}</div>
                        </div>
                      </TD>
                      <TD>{job.repair_type || "-"}</TD>
                      <TD>{job.factory_name || "-"}</TD>
                      <TD>{job.target_return_date ? new Date(job.target_return_date).toLocaleDateString() : "-"}</TD>
                      <TD>{formatDueWindow(job.target_return_date)}</TD>
                      <TD>{statusLabel(job.current_status)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : (
              <p className="text-sm text-slate">No overdue repairs right now.</p>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-700">Approaching Deadlines</p>
              <p className="text-xs text-slate-500">{renderCount(repairCounts.approaching)} items</p>
            </div>
            {repairTargetsQuery.isLoading ? (
              <div className="h-12 animate-pulse rounded-xl bg-sand/70" />
            ) : repairCounts.approaching ? (
              <Table>
                <THead>
                  <TR>
                    <TH>Job ID</TH>
                    <TH>Customer</TH>
                    <TH>Repair Type</TH>
                    <TH>Factory</TH>
                    <TH>Target Return</TH>
                    <TH>Due</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {repairTargets?.approaching?.map((job: any) => (
                    <TR key={`approaching-${job.job_id}`}>
                      <TD>{job.job_id}</TD>
                      <TD>
                        <div>
                          <div className="font-medium">{job.customer_name || "-"}</div>
                          <div className="text-xs text-slate-500">{job.customer_phone || "-"}</div>
                        </div>
                      </TD>
                      <TD>{job.repair_type || "-"}</TD>
                      <TD>{job.factory_name || "-"}</TD>
                      <TD>{job.target_return_date ? new Date(job.target_return_date).toLocaleDateString() : "-"}</TD>
                      <TD>{formatDueWindow(job.target_return_date)}</TD>
                      <TD>{statusLabel(job.current_status)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : (
              <p className="text-sm text-slate">No upcoming deadlines in this window.</p>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-emerald-700">Uncollected Items</p>
              <p className="text-xs text-slate-500">{renderCount(repairCounts.uncollected)} items</p>
            </div>
            {repairTargetsQuery.isLoading ? (
              <div className="h-12 animate-pulse rounded-xl bg-sand/70" />
            ) : repairCounts.uncollected ? (
              <Table>
                <THead>
                  <TR>
                    <TH>Job ID</TH>
                    <TH>Customer</TH>
                    <TH>Repair Type</TH>
                    <TH>Factory</TH>
                    <TH>Target Return</TH>
                    <TH>Due</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {repairTargets?.uncollected?.map((job: any) => (
                    <TR key={`uncollected-${job.job_id}`}>
                      <TD>{job.job_id}</TD>
                      <TD>
                        <div>
                          <div className="font-medium">{job.customer_name || "-"}</div>
                          <div className="text-xs text-slate-500">{job.customer_phone || "-"}</div>
                        </div>
                      </TD>
                      <TD>{job.repair_type || "-"}</TD>
                      <TD>{job.factory_name || "-"}</TD>
                      <TD>{job.target_return_date ? new Date(job.target_return_date).toLocaleDateString() : "-"}</TD>
                      <TD>{formatDueWindow(job.target_return_date)}</TD>
                      <TD>{statusLabel(job.current_status)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : (
              <p className="text-sm text-slate">No uncollected items past the due date.</p>
            )}
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
