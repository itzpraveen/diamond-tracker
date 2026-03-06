"use client";

import { useEffect, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardLabel, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { MobileTableCard, MobileTableRow, Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { RoleGate } from "@/lib/auth";
import { statusLabel } from "@/lib/status";
import { useApi } from "@/lib/useApi";

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function BatchDetailModal({
  batchId,
  onClose
}: {
  batchId: string;
  onClose: () => void;
}) {
  const { request, requestBlob } = useApi();
  const [jobIdToAdd, setJobIdToAdd] = useState("");
  const [addError, setAddError] = useState("");
  const [actionError, setActionError] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [selectedFactoryId, setSelectedFactoryId] = useState("");
  const [isDownloadingManifest, setIsDownloadingManifest] = useState(false);

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
      setActionError("");
      batchQuery.refetch();
    },
    onError: (err: any) => {
      setAddError(err?.message || "Failed to add item");
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: (jobId: string) =>
      request(`/batches/${batchId}/items/${encodeURIComponent(jobId)}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      setActionError("");
      batchQuery.refetch();
    },
    onError: (err: any) => {
      setActionError(err?.message || "Failed to remove item");
    }
  });

  const clearBatchMutation = useMutation({
    mutationFn: () =>
      request(`/batches/${batchId}/items`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      setActionError("");
      batchQuery.refetch();
    },
    onError: (err: any) => {
      setActionError(err?.message || "Failed to clear voucher");
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
    onSuccess: () => {
      setActionError("");
      batchQuery.refetch();
    },
    onError: (err: any) => {
      setActionError(err?.message || "Failed to dispatch voucher");
    }
  });

  const closeMutation = useMutation({
    mutationFn: () =>
      request(`/batches/${batchId}/close`, {
        method: "POST"
      }),
    onSuccess: () => {
      setActionError("");
      batchQuery.refetch();
    },
    onError: (err: any) => {
      setActionError(err?.message || "Failed to close voucher");
    }
  });

  const batch = batchQuery.data;
  const factories = factoriesQuery.data || [];
  const readyLabel = statusLabel("PACKED_READY");

  useEffect(() => {
    setSelectedFactoryId(batch?.factory_id || "");
  }, [batch?.factory_id]);

  const canAddItems = batch?.status === "CREATED";
  const canDispatch = batch?.status === "CREATED" && batch?.item_count > 0;
  const canClose = batch?.status === "DISPATCHED";
  const canEditItems = Boolean(batch) && batch.status !== "CLOSED";
  const canClearBatch =
    canEditItems &&
    Boolean(batch?.items?.length) &&
    batch.items.every((item: any) => item.current_status === "DISPATCHED_TO_FACTORY");

  const handleDownloadManifest = async () => {
    setActionError("");
    setIsDownloadingManifest(true);
    try {
      const blob = await requestBlob(`/batches/${batchId}/manifest.xlsx`);
      const filename = `${(batch?.batch_code || "voucher").toLowerCase().replace(/\s+/g, "-")}-manifest.xlsx`;
      downloadBlob(blob, filename);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to download Excel");
    } finally {
      setIsDownloadingManifest(false);
    }
  };

  const handleClearBatch = () => {
    if (!batch?.items?.length) {
      return;
    }
    const confirmed = window.confirm(
      `Remove all ${batch.items.length} items from ${batch.batch_code}? Their status will revert to ${readyLabel}.`
    );
    if (!confirmed) {
      return;
    }
    setActionError("");
    clearBatchMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-[var(--shadow-lg)] sm:max-w-3xl sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <CardLabel>Issue Voucher</CardLabel>
            <CardTitle className="mt-1">{batch?.batch_code || "Loading..."}</CardTitle>
            {batch?.status && <StatusBadge status={batch.status} className="mt-2" />}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

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

        <RoleGate roles={["Admin", "Dispatch"]}>
          {canAddItems && (
            <div className="mb-5 rounded-xl border border-ink/8 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate">Add Item</p>
              <p className="mt-1 text-sm font-medium">Scan items into this voucher</p>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate">Factory</label>
                  <Select
                    value={selectedFactoryId}
                    onChange={(e) => {
                      setSelectedFactoryId(e.target.value);
                      setAddError("");
                    }}
                    disabled={Boolean(batch?.factory_id) && batch?.item_count > 0}
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
                <p className="text-xs text-slate">Only items with status {readyLabel.toUpperCase()} can be issued</p>
              </div>
            </div>
          )}
        </RoleGate>

        <RoleGate roles={["Admin", "Dispatch"]}>
          {canDispatch && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Dispatch</p>
              <p className="mt-1 text-sm font-medium text-amber-900">Issue Voucher</p>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate">Factory</label>
                  <Select
                    value={selectedFactoryId}
                    onChange={(e) => setSelectedFactoryId(e.target.value)}
                    disabled={Boolean(batch?.factory_id) && batch?.item_count > 0}
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
                  {dispatchMutation.isPending ? "Issuing..." : "Issue Voucher"}
                </Button>
                <p className="text-xs text-slate">Confirm the issue date after all items are scanned</p>
              </div>
            </div>
          )}
        </RoleGate>

        <RoleGate roles={["Admin", "Dispatch"]}>
          {canClose && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Close</p>
              <p className="mt-1 text-sm font-medium text-emerald-900">Close Voucher</p>
              <div className="mt-3">
                <Button onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
                  {closeMutation.isPending ? "Closing..." : "Close Voucher"}
                </Button>
                <p className="mt-2 text-xs text-slate">
                  All items must have returned (RECEIVED_AT_SHOP or later) to close
                </p>
              </div>
            </div>
          )}
        </RoleGate>

        <div className="mb-5 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadManifest}
            disabled={isDownloadingManifest || !batch?.items?.length}
          >
            {isDownloadingManifest ? "Downloading..." : "Download Voucher Excel"}
          </Button>
          <RoleGate roles={["Admin", "Dispatch"]}>
            {canClearBatch && (
              <Button
                variant="danger"
                onClick={handleClearBatch}
                disabled={clearBatchMutation.isPending}
              >
                {clearBatchMutation.isPending ? "Clearing..." : "Clear Voucher Items"}
              </Button>
            )}
          </RoleGate>
        </div>

        {actionError && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm text-red-700">{actionError}</p>
          </div>
        )}

        <div>
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate">Items in Voucher</p>
            {canEditItems && (
              <p className="text-xs text-slate">Removed items automatically return to {readyLabel}.</p>
            )}
          </div>
          {batch?.items?.length > 0 ? (
            <>
              <div className="hidden sm:block">
                <Table>
                  <THead>
                    <TR>
                      <TH>Job ID</TH>
                      <TH>Customer</TH>
                      <TH>Status</TH>
                      <TH>Description</TH>
                      <TH>Actions</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {batch.items.map((item: any) => {
                      const canRemoveItem = canEditItems && item.current_status === "DISPATCHED_TO_FACTORY";
                      return (
                        <TR key={item.job_id}>
                          <TD className="font-medium">{item.job_id}</TD>
                          <TD>{item.customer_name || "-"}</TD>
                          <TD>
                            <StatusBadge status={item.current_status} />
                          </TD>
                          <TD className="max-w-xs truncate text-slate">{item.item_description}</TD>
                          <TD>
                            {canRemoveItem ? (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => removeItemMutation.mutate(item.job_id)}
                                disabled={removeItemMutation.isPending}
                              >
                                {removeItemMutation.isPending ? "Removing..." : "Remove"}
                              </Button>
                            ) : (
                              <span className="text-xs text-slate">-</span>
                            )}
                          </TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>
              </div>

              <div className="space-y-3 sm:hidden">
                {batch.items.map((item: any) => {
                  const canRemoveItem = canEditItems && item.current_status === "DISPATCHED_TO_FACTORY";
                  return (
                    <MobileTableCard key={item.job_id}>
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{item.job_id}</p>
                          <p className="text-sm text-slate">{item.customer_name || "No customer"}</p>
                        </div>
                        <StatusBadge status={item.current_status} size="sm" />
                      </div>
                      <p className="text-sm text-slate">{item.item_description}</p>
                      {canRemoveItem && (
                        <div className="mt-3 border-t border-ink/6 pt-3">
                          <Button
                            variant="danger"
                            size="sm"
                            className="w-full"
                            onClick={() => removeItemMutation.mutate(item.job_id)}
                            disabled={removeItemMutation.isPending}
                          >
                            {removeItemMutation.isPending ? "Removing..." : "Remove From Voucher"}
                          </Button>
                        </div>
                      )}
                    </MobileTableCard>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-ink/8 bg-sand/30 py-8 text-center">
              <p className="text-sm text-slate">No items in this voucher yet.</p>
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
  const [selectedCreateFactoryId, setSelectedCreateFactoryId] = useState("");
  const [createError, setCreateError] = useState("");

  const batchesQuery = useQuery({
    queryKey: ["batches"],
    queryFn: () => request<any[]>("/batches")
  });

  const factoriesQuery = useQuery({
    queryKey: ["factories"],
    queryFn: () => request<any[]>("/factories")
  });

  const createMutation = useMutation({
    mutationFn: () =>
      request("/batches", {
        method: "POST",
        body: JSON.stringify({
          month: month ? Number(month) : undefined,
          year: year ? Number(year) : undefined,
          factory_id: selectedCreateFactoryId || undefined
        })
      }),
    onSuccess: (createdVoucher: any) => {
      setCreateError("");
      setSelectedBatchId(createdVoucher.id);
      batchesQuery.refetch();
    },
    onError: (err: any) => {
      setCreateError(err?.message || "Failed to create voucher");
    }
  });

  const batches = batchesQuery.data || [];
  const factories = factoriesQuery.data || [];

  useEffect(() => {
    if (!factories.length) {
      setSelectedCreateFactoryId("");
      return;
    }
    if (!selectedCreateFactoryId || !factories.some((factory) => factory.id === selectedCreateFactoryId)) {
      setSelectedCreateFactoryId(factories[0].id);
    }
  }, [factories, selectedCreateFactoryId]);

  const handleCreateVoucher = () => {
    if (!selectedCreateFactoryId) {
      setCreateError("Select a factory before creating a voucher");
      return;
    }
    createMutation.mutate();
  };

  return (
    <AppShell>
      <Card className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardLabel>Vouchers</CardLabel>
            <CardTitle>Issue Vouchers</CardTitle>
            <CardDescription>Create multiple factory-specific vouchers per day, fix scan mistakes, and export Excel.</CardDescription>
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
              <div className="min-w-[12rem]">
                <label className="mb-1 block text-xs font-medium text-slate">Factory</label>
                <Select
                  value={selectedCreateFactoryId}
                  onChange={(e) => {
                    setSelectedCreateFactoryId(e.target.value);
                    setCreateError("");
                  }}
                >
                  <option value="">{factories.length ? "Select factory" : "No factories available"}</option>
                  {factories.map((factory) => (
                    <option key={factory.id} value={factory.id}>
                      {factory.name}
                    </option>
                  ))}
                </Select>
              </div>
              <Button size="sm" onClick={handleCreateVoucher} disabled={createMutation.isPending || !selectedCreateFactoryId}>
                {createMutation.isPending ? "Creating..." : "Create Voucher"}
              </Button>
            </div>
          </RoleGate>
        </div>

        {createError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm text-red-700">{createError}</p>
          </div>
        )}

        <div className="hidden sm:block">
          <Table>
            <THead>
              <TR>
                <TH>Voucher</TH>
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
                    <Button variant="outline" size="sm" onClick={() => setSelectedBatchId(batch.id)}>
                      View
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>

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
            <p className="text-slate">No vouchers found.</p>
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
