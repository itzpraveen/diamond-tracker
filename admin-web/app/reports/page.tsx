"use client";

import { useMemo, useState } from "react";

import AppShell from "@/components/AppShell";
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

  const repairTargets = repairTargetsQuery.data || { overdue: [], approaching: [], uncollected: [] };

  return (
    <AppShell>
      <Card className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate">Reports</p>
            <h1 className="text-2xl font-semibold font-display">Exports & Delays</h1>
            <p className="mt-2 text-sm text-slate">Generate CSV exports or review delayed batches.</p>
          </div>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-ink/10 bg-white/70 p-2">
            <Button variant="outline" onClick={() => exportCsv("jobs")}>Export Jobs</Button>
            <Button variant="outline" onClick={() => exportCsv("batches")}>Export Batches</Button>
            <Button variant="outline" onClick={() => exportCsv("incidents")}>Export Incidents</Button>
          </div>
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
            {(delaysQuery.data || []).map((batch) => (
              <TR key={batch.batch_code}>
                <TD>{batch.batch_code}</TD>
                <TD>{batch.expected_return_date ? new Date(batch.expected_return_date).toLocaleDateString() : "-"}</TD>
                <TD>{batch.dispatch_date ? new Date(batch.dispatch_date).toLocaleDateString() : "-"}</TD>
                <TD>{batch.delay_days}</TD>
              </TR>
            ))}
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

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-red-500">Overdue</p>
            <p className="mt-2 text-2xl font-semibold">{repairTargets.overdue.length}</p>
            <p className="text-sm text-red-700">Not back from repair</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-600">Approaching</p>
            <p className="mt-2 text-2xl font-semibold">{repairTargets.approaching.length}</p>
            <p className="text-sm text-amber-700">Due within {windowDaysValue} days</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Uncollected</p>
            <p className="mt-2 text-2xl font-semibold">{repairTargets.uncollected.length}</p>
            <p className="text-sm text-emerald-700">Returned, waiting on customer</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-red-700">Overdue Repairs</p>
              <p className="text-xs text-slate-500">{repairTargets.overdue.length} items</p>
            </div>
            {repairTargets.overdue.length ? (
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
                  {repairTargets.overdue.map((job: any) => (
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
              <p className="text-xs text-slate-500">{repairTargets.approaching.length} items</p>
            </div>
            {repairTargets.approaching.length ? (
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
                  {repairTargets.approaching.map((job: any) => (
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
              <p className="text-xs text-slate-500">{repairTargets.uncollected.length} items</p>
            </div>
            {repairTargets.uncollected.length ? (
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
                  {repairTargets.uncollected.map((job: any) => (
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
