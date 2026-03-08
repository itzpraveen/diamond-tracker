"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useMutation, useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { RoleGate } from "@/lib/auth";
import { useApi } from "@/lib/useApi";

const incidentStatuses = ["OPEN", "RESOLVED"];
const incidentTypes = ["StickerMismatch", "MissingItem", "DuplicateScan", "Damage", "Other"];

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function IncidentsPageContent() {
  const { request } = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "");
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get("type") ?? "");
  const [jobIdFilter, setJobIdFilter] = useState(() => searchParams.get("job_id") ?? "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (jobIdFilter) params.set("job_id", jobIdFilter);
    const nextPath = params.toString() ? `/incidents?${params.toString()}` : "/incidents";
    router.replace(nextPath, { scroll: false });
  }, [jobIdFilter, router, statusFilter, typeFilter]);

  const incidentsQuery = useQuery({
    queryKey: ["incidents", statusFilter, typeFilter, jobIdFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (jobIdFilter) params.set("job_id", jobIdFilter);
      const queryString = params.toString();
      return request<any[]>(queryString ? `/incidents?${queryString}` : "/incidents");
    }
  });

  const resolveMutation = useMutation({
    mutationFn: (incidentId: string) =>
      request(`/incidents/${incidentId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolution_notes: "Resolved via admin panel" })
      }),
    onSuccess: () => incidentsQuery.refetch()
  });

  const clearFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
    setJobIdFilter("");
  };

  const hasFilters = Boolean(statusFilter || typeFilter || jobIdFilter);

  return (
    <AppShell>
      <Card className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate">Incidents</p>
            <h1 className="text-2xl font-semibold font-display">Exceptions & Resolutions</h1>
            <p className="mt-2 text-sm text-slate">Investigate discrepancies, focus the open queue, and close the loop fast.</p>
          </div>
          {statusFilter === "OPEN" ? (
            <Badge variant="warning">Showing unresolved incidents</Badge>
          ) : (
            <Badge variant="default">Showing all incidents</Badge>
          )}
        </div>

        <div className="rounded-xl border border-ink/8 bg-sand/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate">Filters</p>
            {hasFilters ? (
              <button className="text-xs font-medium text-forest hover:underline" onClick={clearFilters}>
                Clear all
              </button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate">Status</label>
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                {incidentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate">Type</label>
              <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="">All types</option>
                {incidentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate">Job ID</label>
              <Input
                placeholder="DJ-2026-000001"
                value={jobIdFilter}
                onChange={(event) => setJobIdFilter(event.target.value)}
              />
            </div>
          </div>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Type</TH>
              <TH>Status</TH>
              <TH>Created</TH>
              <TH>Description</TH>
              <TH>Action</TH>
            </TR>
          </THead>
          <TBody>
            {incidentsQuery.isLoading ? (
              <TR>
                <TD colSpan={5}>
                  <div className="h-10 animate-pulse rounded-xl bg-sand/70" />
                </TD>
              </TR>
            ) : (incidentsQuery.data || []).length ? (
              (incidentsQuery.data || []).map((incident) => (
                <TR key={incident.id}>
                  <TD>{incident.type}</TD>
                  <TD>
                    <Badge variant={incident.status === "RESOLVED" ? "success" : "warning"}>{incident.status}</Badge>
                  </TD>
                  <TD className="text-slate">{formatDateTime(incident.created_at)}</TD>
                  <TD className="max-w-xl truncate">{incident.description}</TD>
                  <TD>
                    <RoleGate roles={["Admin", "QC_Stock"]}>
                      {incident.status !== "RESOLVED" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveMutation.mutate(incident.id)}
                          disabled={resolveMutation.isPending}
                        >
                          {resolveMutation.isPending ? "Resolving..." : "Resolve"}
                        </Button>
                      ) : (
                        <span className="text-sm text-slate">Closed</span>
                      )}
                    </RoleGate>
                  </TD>
                </TR>
              ))
            ) : (
              <TR>
                <TD colSpan={5}>
                  <p className="text-sm text-slate">No incidents match the current filters.</p>
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </Card>
    </AppShell>
  );
}

export default function IncidentsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <Card className="min-h-[220px]">
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
            </div>
          </Card>
        </AppShell>
      }
    >
      <IncidentsPageContent />
    </Suspense>
  );
}
