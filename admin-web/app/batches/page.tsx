"use client";

import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardLabel, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR, MobileTableCard, MobileTableRow } from "@/components/ui/table";
import { getApiBaseUrl } from "@/lib/apiBase";
import { RoleGate } from "@/lib/auth";
import { statusLabel } from "@/lib/status";
import { useApi } from "@/lib/useApi";

function BatchDetailModal({
  batchId,
  onClose
}: {
  batchId: string;
  onClose: () => void;
}) {
  const { request } = useApi();
  const [jobIdToAdd, setJobIdToAdd] = useState("");
  const [addError, setAddError] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [selectedFactoryId, setSelectedFactoryId] = useState("");

  const batchQuery = useQuery({
    queryKey: ["batch", batchId],
    queryFn: () => request<any>(`/batches/${batchId}`)
  });

  const factoriesQuery = useQuery({
    queryKey: ["factories"],
    queryFn: () => request<any[]>("/factories")
  });

  const addItemMutation = useMutation({
    mutationFn: () =>
      request(`/jobs/${jobIdToAdd.trim()}/scan`, {
        method: "POST",
        body: JSON.stringify({
          to_status: "DISPATCHED_TO_FACTORY",
          batch_id: batchId,
          factory_id: selectedFactoryId || undefined,
          remarks: "Dispatch scan"
        })
      }),
    onSuccess: () => {
      setJobIdToAdd("");
      setAddError("");
      batchQuery.refetch();
    },
    onError: (err: any) => {
      setAddError(err?.message || "Failed to add item");
    }
  });

  const handleAddItem = () => {
    if (!selectedFactoryId) {
      setAddError("Select a factory before dispatching");
      return;
    }
    addItemMutation.mutate();
  };

  const dispatchMutation = useMutation({
    mutationFn: () =>
      request(`/batches/${batchId}/dispatch`, {
        method: "POST",
        body: JSON.stringify({
          dispatch_date: dispatchDate ? new Date(dispatchDate).toISOString() : null,
          expected_return_date: expectedReturn ? new Date(expectedReturn).toISOString() : null,
          factory_id: selectedFactoryId || undefined
        })
      }),
    onSuccess: () => batchQuery.refetch()
  });

  const closeMutation = useMutation({
    mutationFn: () =>
      request(`/batches/${batchId}/close`, {
        method: "POST"
      }),
    onSuccess: () => batchQuery.refetch()
  });

  const batch = batchQuery.data;
  const factories = factoriesQuery.data || [];

  useEffect(() => {
    setSelectedFactoryId(batch?.factory_id || "");
  }, [batch?.factory_id]);

  const manifestUrl = useMemo(() => {
    const base = getApiBaseUrl();
    return `${base}/batches/${batchId}/manifest.pdf`;
  }, [batchId]);

  const canAddItems = batch?.status === "CREATED";
  const canDispatch = batch?.status === "CREATED" && batch?.item_count > 0;
  const canClose = batch?.status === "DISPATCHED";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-[var(--shadow-lg)] sm:max-w-3xl sm:rounded-2xl sm:p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <CardLabel>Batch</CardLabel>
            <CardTitle className="mt-1">{batch?.batch_code || "Loading..."}</CardTitle>
            {batch?.status && <StatusBadge status={batch.status} className="mt-2" />}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Batch Info */}
        <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-ink/8 bg-sand/30 p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate">Items</p>
            <p className="mt-1 text-lg font-semibold">{batch?.item_count || 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate">Factory</p>
            <p className="mt-1 font-medium">{batch?.factory_name || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-slate">Dispatch Date</p>
            <p className="mt-1 font-medium">
              {batch?.dispatch_date ? new Date(batch.dispatch_date).toLocaleDateString() : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate">Expected Return</p>
            <p className="mt-1 font-medium">
              {batch?.expected_return_date ? new Date(batch.expected_return_date).toLocaleDateString() : "-"}
            </p>
          </div>
        </div>

        {/* Add Item Section */}
        <RoleGate roles={["Admin", "Dispatch"]}>
          {canAddItems && (
            <div className="mb-5 rounded-xl border border-ink/8 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate">Add Item</p>
              <p className="mt-1 text-sm font-medium">Scan & Dispatch Item</p>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate">Factory</label>
                  <Select
                    value={selectedFactoryId}
                    onChange={(e) => {
                      setSelectedFactoryId(e.target.value);
                      setAddError("");
                    }}
                    disabled={Boolean(batch?.factory_id)}
                  >
                    <option value="">{factories.length ? "Select factory" : "No factories available"}</option>
                    {factories.map((factory) => (
                      <option key={factory.id} value={factory.id}>
                        {factory.name}
                      </option>
                    ))}
                  </Select>
                  {!factories.length && (
                    <p className="mt-1 text-xs text-slate">Add factories in Settings to enable dispatch.</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    className="flex-1"
                    placeholder="Scan Job ID (e.g., DJ-2026-000001)"
                    value={jobIdToAdd}
                    onChange={(e) => setJobIdToAdd(e.target.value)}
                  />
                  <Button
                    onClick={handleAddItem}
                    disabled={!jobIdToAdd.trim() || addItemMutation.isPending || !selectedFactoryId}
                  >
                    {addItemMutation.isPending ? "Scanning..." : "Scan"}
                  </Button>
                </div>
                {addError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <p className="text-sm text-red-700">{addError}</p>
                  </div>
                )}
                <p className="text-xs text-slate">Only items with status PACKED_READY can be dispatched</p>
              </div>
            </div>
          )}
        </RoleGate>

        {/* Dispatch Section */}
        <RoleGate roles={["Admin", "Dispatch"]}>
          {canDispatch && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Dispatch</p>
              <p className="mt-1 text-sm font-medium text-amber-900">Dispatch Batch</p>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate">Factory</label>
                  <Select
                    value={selectedFactoryId}
                    onChange={(e) => setSelectedFactoryId(e.target.value)}
                    disabled={Boolean(batch?.factory_id)}
                  >
                    <option value="">{factories.length ? "Select factory" : "No factories available"}</option>
                    {factories.map((factory) => (
                      <option key={factory.id} value={factory.id}>
                        {factory.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate">Dispatch Date</label>
                    <Input
                      type="date"
                      value={dispatchDate}
                      onChange={(e) => setDispatchDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate">Expected Return</label>
                    <Input
                      type="date"
                      value={expectedReturn}
                      onChange={(e) => setExpectedReturn(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => dispatchMutation.mutate()}
                  disabled={dispatchMutation.isPending || !selectedFactoryId}
                >
                  {dispatchMutation.isPending ? "Dispatching..." : "Dispatch Batch"}
                </Button>
                <p className="text-xs text-slate">
                  Confirm dispatch date after all items are scanned
                </p>
              </div>
            </div>
          )}
        </RoleGate>

        {/* Close Section */}
        <RoleGate roles={["Admin", "Dispatch"]}>
          {canClose && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Close</p>
              <p className="mt-1 text-sm font-medium text-emerald-900">Close Batch</p>
              <div className="mt-3">
                <Button
                  onClick={() => closeMutation.mutate()}
                  disabled={closeMutation.isPending}
                >
                  {closeMutation.isPending ? "Closing..." : "Close Batch"}
                </Button>
                <p className="mt-2 text-xs text-slate">
                  All items must have returned (RECEIVED_AT_SHOP or later) to close
                </p>
              </div>
            </div>
          )}
        </RoleGate>

        {/* Actions */}
        <div className="mb-5">
          <a
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/12 bg-white/80 px-4 py-2.5 text-sm font-semibold text-ink shadow-[0_2px_8px_rgba(15,23,20,0.04)] transition hover:border-ink/20 hover:bg-white"
            href={manifestUrl}
            target="_blank"
            rel="noreferrer"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Manifest PDF
          </a>
        </div>

        {/* Items Table */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate">Items in Batch</p>
          {batch?.items?.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Table>
                  <THead>
                    <TR>
                      <TH>Job ID</TH>
                      <TH>Customer</TH>
                      <TH>Status</TH>
                      <TH>Description</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {batch.items.map((item: any) => (
                      <TR key={item.job_id}>
                        <TD className="font-medium">{item.job_id}</TD>
                        <TD>{item.customer_name || "-"}</TD>
                        <TD>
                          <StatusBadge status={item.current_status} />
                        </TD>
                        <TD className="max-w-xs truncate text-slate">{item.item_description}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 sm:hidden">
                {batch.items.map((item: any) => (
                  <MobileTableCard key={item.job_id}>
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{item.job_id}</p>
                        <p className="text-sm text-slate">{item.customer_name || "No customer"}</p>
                      </div>
                      <StatusBadge status={item.current_status} size="sm" />
                    </div>
                    <p className="text-sm text-slate">{item.item_description}</p>
                  </MobileTableCard>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-ink/8 bg-sand/30 py-8 text-center">
              <p className="text-sm text-slate">No items in this batch yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BatchesPage() {
  const { request } = useApi();
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const batchesQuery = useQuery({
    queryKey: ["batches"],
    queryFn: () => request<any[]>("/batches")
  });

  const createMutation = useMutation({
    mutationFn: () =>
      request("/batches", {
        method: "POST",
        body: JSON.stringify({
          month: month ? Number(month) : undefined,
          year: year ? Number(year) : undefined
        })
      }),
    onSuccess: () => batchesQuery.refetch()
  });

  const batches = batchesQuery.data || [];

  return (
    <AppShell>
      <Card className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardLabel>Batches</CardLabel>
            <CardTitle>Monthly Dispatches</CardTitle>
            <CardDescription>Create or open dispatch batches, manage manifests, and track returns.</CardDescription>
          </div>
          <RoleGate roles={["Admin", "Dispatch"]}>
            <div className="flex flex-wrap items-end gap-2 rounded-xl border border-ink/8 bg-sand/30 p-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate">Month</label>
                <Input
                  placeholder="1-12"
                  className="w-20"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate">Year</label>
                <Input
                  placeholder="2026"
                  className="w-24"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={() => createMutation.mutate()}>
                Create / Open
              </Button>
            </div>
          </RoleGate>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block">
          <Table>
            <THead>
              <TR>
                <TH>Batch</TH>
                <TH>Status</TH>
                <TH>Factory</TH>
                <TH>Dispatch Date</TH>
                <TH>Expected Return</TH>
                <TH>Items</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {batches.map((batch) => (
                <TR key={batch.id}>
                  <TD className="font-medium">{batch.batch_code}</TD>
                  <TD>
                    <StatusBadge status={batch.status} />
                  </TD>
                  <TD className="text-slate">{batch.factory_name || "-"}</TD>
                  <TD className="text-slate">
                    {batch.dispatch_date ? new Date(batch.dispatch_date).toLocaleDateString() : "-"}
                  </TD>
                  <TD className="text-slate">
                    {batch.expected_return_date ? new Date(batch.expected_return_date).toLocaleDateString() : "-"}
                  </TD>
                  <TD>{batch.item_count}</TD>
                  <TD>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBatchId(batch.id)}
                    >
                      View
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 sm:hidden">
          {batches.map((batch) => (
            <MobileTableCard key={batch.id}>
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="font-semibold">{batch.batch_code}</p>
                  <p className="text-sm text-slate">{batch.factory_name || "No factory"}</p>
                </div>
                <StatusBadge status={batch.status} size="sm" />
              </div>
              <div className="space-y-1 border-t border-ink/6 pt-3">
                <MobileTableRow label="Items">{batch.item_count}</MobileTableRow>
                <MobileTableRow label="Dispatch">
                  {batch.dispatch_date ? new Date(batch.dispatch_date).toLocaleDateString() : "-"}
                </MobileTableRow>
                <MobileTableRow label="Return">
                  {batch.expected_return_date ? new Date(batch.expected_return_date).toLocaleDateString() : "-"}
                </MobileTableRow>
              </div>
              <div className="mt-3 border-t border-ink/6 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedBatchId(batch.id)}
                >
                  View Details
                </Button>
              </div>
            </MobileTableCard>
          ))}
        </div>

        {!batches.length && (
          <div className="py-12 text-center">
            <p className="text-slate">No batches found.</p>
          </div>
        )}
      </Card>

      {selectedBatchId && (
        <BatchDetailModal
          batchId={selectedBatchId}
          onClose={() => {
            setSelectedBatchId(null);
            batchesQuery.refetch();
          }}
        />
      )}
    </AppShell>
  );
}
