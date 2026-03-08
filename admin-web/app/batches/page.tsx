"use client";

import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardLabel, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { MobileTableCard, MobileTableRow, Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { RoleGate } from "@/lib/auth";
import { statusLabel } from "@/lib/status";
import { cn } from "@/lib/utils";
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

function formatDate(value?: string | Date | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function toDateInputValue(value?: string | Date | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
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
  const [scanFeedback, setScanFeedback] = useState<"idle" | "success" | "error">("idle");
  const [scanFeedbackMessage, setScanFeedbackMessage] = useState("Scanner ready");
  const scanInputRef = useRef<HTMLInputElement>(null);
  const scanFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const batchQuery = useQuery({
    queryKey: ["batch", batchId],
    queryFn: () => request<any>(`/batches/${batchId}`)
  });

  const factoriesQuery = useQuery({
    queryKey: ["factories"],
    queryFn: () => request<any[]>("/factories")
  });

  const addItemMutation = useMutation({
    mutationFn: (jobId: string) =>
      request(`/jobs/${jobId}/scan`, {
        method: "POST",
        body: JSON.stringify({
          to_status: "DISPATCHED_TO_FACTORY",
          batch_id: batchId,
          factory_id: selectedFactoryId || undefined,
          remarks: "Dispatch scan"
        })
      }),
    onSuccess: (_data, jobId) => {
      setJobIdToAdd("");
      setAddError("");
      setActionError("");
      setScanFeedback("success");
      setScanFeedbackMessage(`${jobId} added to ${batch?.batch_code || "voucher"}`);
      focusScanInput();
      batchQuery.refetch();
    },
    onError: (err: any, jobId) => {
      const message = err?.message || "Failed to add item";
      setAddError(message);
      setScanFeedback("error");
      setScanFeedbackMessage(`${jobId}: ${message}`);
      focusScanInput(true);
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
  const selectedFactoryName =
    batch?.factory_name || factories.find((factory) => factory.id === selectedFactoryId)?.name || "";
  const idleScanFeedbackMessage = selectedFactoryId
    ? `Scanner ready for ${selectedFactoryName || "selected factory"}`
    : "Select a factory before scanning";

  useEffect(() => {
    setSelectedFactoryId(batch?.factory_id || "");
  }, [batch?.factory_id]);

  useEffect(() => {
    if (!batch) {
      return;
    }
    setDispatchDate(batch.dispatch_date ? toDateInputValue(batch.dispatch_date) : toDateInputValue(new Date()));
    setExpectedReturn(batch.expected_return_date ? toDateInputValue(batch.expected_return_date) : "");
  }, [batch?.id, batch?.dispatch_date, batch?.expected_return_date]);

  useEffect(() => {
    return () => {
      if (scanFeedbackTimerRef.current) {
        clearTimeout(scanFeedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (scanFeedback !== "idle") {
      if (scanFeedbackTimerRef.current) {
        clearTimeout(scanFeedbackTimerRef.current);
      }
      scanFeedbackTimerRef.current = setTimeout(() => {
        setScanFeedback("idle");
        scanFeedbackTimerRef.current = null;
      }, 1400);
      return;
    }
    if (scanFeedbackTimerRef.current) {
      clearTimeout(scanFeedbackTimerRef.current);
      scanFeedbackTimerRef.current = null;
    }
    setScanFeedbackMessage(idleScanFeedbackMessage);
  }, [idleScanFeedbackMessage, scanFeedback]);

  const canAddItems = batch?.status === "CREATED";
  const canDispatch = batch?.status === "CREATED" && batch?.item_count > 0;
  const canClose = batch?.status === "DISPATCHED";
  const canEditItems = Boolean(batch) && batch.status !== "CLOSED";
  const isVoucherFactoryLocked = Boolean(batch?.factory_id);
  const canClearBatch =
    canEditItems &&
    Boolean(batch?.items?.length) &&
    batch.items.every((item: any) => item.current_status === "DISPATCHED_TO_FACTORY");

  const focusScanInput = (select = false) => {
    setTimeout(() => {
      const input = scanInputRef.current;
      if (!input) {
        return;
      }
      input.focus();
      if (select) {
        input.select();
      }
    }, 0);
  };

  useEffect(() => {
    if (!canAddItems) {
      return;
    }
    focusScanInput();
  }, [batch?.id, canAddItems, selectedFactoryId]);

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

  const handleAddItem = () => {
    if (addItemMutation.isPending) {
      return;
    }
    const normalizedJobId = jobIdToAdd.trim().toUpperCase();
    if (!normalizedJobId) {
      focusScanInput();
      return;
    }
    if (!selectedFactoryId) {
      const message = "Select a factory before dispatching";
      setAddError(message);
      setScanFeedback("error");
      setScanFeedbackMessage(message);
      focusScanInput(true);
      return;
    }
    setActionError("");
    setAddError("");
    setJobIdToAdd(normalizedJobId);
    addItemMutation.mutate(normalizedJobId);
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

        <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-ink/8 bg-sand/30 p-4 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <p className="text-xs text-slate">Items</p>
            <p className="mt-1 text-lg font-semibold">{batch?.item_count || 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate">Factory</p>
            <p className="mt-1 font-medium">{batch?.factory_name || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-slate">Created At</p>
            <p className="mt-1 font-medium">
              {formatDateTime(batch?.created_at)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate">Issued At</p>
            <p className="mt-1 font-medium">{formatDateTime(batch?.dispatch_date)}</p>
          </div>
          <div>
            <p className="text-xs text-slate">Return By</p>
            <p className="mt-1 font-medium">
              {formatDate(batch?.expected_return_date)}
            </p>
          </div>
        </div>

        <RoleGate roles={["Admin", "Dispatch"]}>
          {canAddItems && (
            <div className="mb-5 rounded-xl border border-ink/8 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate">Add Item</p>
              <p className="mt-1 text-sm font-medium">Scan items into this voucher</p>
              <div className="mt-3 space-y-3">
                {!isVoucherFactoryLocked && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate">Factory</label>
                    <Select
                      value={selectedFactoryId}
                      onChange={(e) => {
                        setSelectedFactoryId(e.target.value);
                        setAddError("");
                      }}
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
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    ref={scanInputRef}
                    className={cn(
                      "flex-1 transition-all duration-200",
                      scanFeedback === "success" && "border-emerald-300 bg-emerald-50/80 focus:border-emerald-400 focus:ring-emerald-100",
                      scanFeedback === "error" && "border-red-300 bg-red-50/80 focus:border-red-400 focus:ring-red-100"
                    )}
                    placeholder="Scan Job ID (e.g., DJ-2026-000001)"
                    value={jobIdToAdd}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    onChange={(e) => {
                      setJobIdToAdd(e.target.value);
                      setAddError("");
                      if (scanFeedback !== "idle") {
                        setScanFeedback("idle");
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddItem}
                    className={cn(
                      "min-w-[7.5rem] transition-all duration-200",
                      scanFeedback === "success" && "bg-emerald-600 hover:bg-emerald-600 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]",
                      scanFeedback === "error" && "bg-red-600 hover:bg-red-600 shadow-[0_0_0_3px_rgba(239,68,68,0.18)]"
                    )}
                    disabled={addItemMutation.isPending || !selectedFactoryId}
                  >
                    {addItemMutation.isPending
                      ? "Scanning..."
                      : scanFeedback === "success"
                        ? "Added"
                        : scanFeedback === "error"
                          ? "Retry"
                          : "Scan"}
                  </Button>
                </div>
                <div
                  aria-live="polite"
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200",
                    scanFeedback === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                    scanFeedback === "error" && "border-red-200 bg-red-50 text-red-700",
                    scanFeedback === "idle" && "border-ink/8 bg-sand/30 text-slate"
                  )}
                >
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      addItemMutation.isPending && "animate-pulse bg-gold",
                      !addItemMutation.isPending && scanFeedback === "success" && "bg-emerald-500",
                      !addItemMutation.isPending && scanFeedback === "error" && "bg-red-500",
                      !addItemMutation.isPending && scanFeedback === "idle" && "bg-slate/50"
                    )}
                  />
                  <span>{addItemMutation.isPending ? "Validating scan..." : scanFeedbackMessage}</span>
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
                {!isVoucherFactoryLocked && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate">Factory</label>
                    <Select
                      value={selectedFactoryId}
                      onChange={(e) => setSelectedFactoryId(e.target.value)}
                    >
                      <option value="">{factories.length ? "Select factory" : "No factories available"}</option>
                      {factories.map((factory) => (
                        <option key={factory.id} value={factory.id}>
                          {factory.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate">Issue Date</label>
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
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedCreateFactoryId, setSelectedCreateFactoryId] = useState("");
  const [createError, setCreateError] = useState("");
  const [pageError, setPageError] = useState("");
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);

  const batchesQuery = useQuery({
    queryKey: ["batches"],
    queryFn: () => request<any[]>("/batches")
  });

  const factoriesQuery = useQuery({
    queryKey: ["factories"],
    queryFn: () => request<any[]>("/factories")
  });

  const createMutation = useMutation({
    mutationFn: (factoryId: string) =>
      request("/batches", {
        method: "POST",
        body: JSON.stringify({
          factory_id: factoryId || undefined
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

  const deleteMutation = useMutation({
    mutationFn: (batchId: string) =>
      request(`/batches/${batchId}`, {
        method: "DELETE"
      }),
    onSuccess: (_data, batchId) => {
      setDeletingBatchId(null);
      setPageError("");
      if (selectedBatchId === batchId) {
        setSelectedBatchId(null);
      }
      batchesQuery.refetch();
    },
    onError: (err: any) => {
      setDeletingBatchId(null);
      setPageError(err?.message || "Failed to delete voucher");
    }
  });

  const batches = (batchesQuery.data || []).filter((batch) => !batch.batch_code.startsWith("BATCH-"));
  const factories = factoriesQuery.data || [];
  const activeFactories = factories.filter((factory) => factory.is_active !== false);

  useEffect(() => {
    if (!activeFactories.length) {
      setSelectedCreateFactoryId("");
      return;
    }
    if (
      !selectedCreateFactoryId ||
      !activeFactories.some((factory) => factory.id === selectedCreateFactoryId)
    ) {
      setSelectedCreateFactoryId(activeFactories[0].id);
    }
  }, [activeFactories, selectedCreateFactoryId]);

  const handleCreateVoucher = () => {
    if (!selectedCreateFactoryId) {
      setCreateError("Select a factory before creating a voucher");
      return;
    }
    setCreateError("");
    createMutation.mutate(selectedCreateFactoryId);
  };

  const handleDeleteVoucher = (batch: any) => {
    if (deleteMutation.isPending) {
      return;
    }
    const hasItems = Number(batch.item_count || 0) > 0;
    const confirmed = window.confirm(
      hasItems
        ? `Delete ${batch.batch_code} and remove its ${batch.item_count} item${batch.item_count === 1 ? "" : "s"} from the voucher?\n\nItems in a created voucher will be returned to Packed Ready.`
        : `Delete ${batch.batch_code} permanently?`
    );
    if (!confirmed) {
      return;
    }
    setDeletingBatchId(batch.id);
    setPageError("");
    deleteMutation.mutate(batch.id);
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
            <div className="space-y-3 rounded-xl border border-ink/8 bg-sand/30 p-4 sm:min-w-[28rem]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate">Create Voucher</p>
                <p className="mt-1 text-sm font-medium text-ink">Select the destination factory and open a new voucher.</p>
                <p className="mt-1 text-xs text-slate">Voucher number and created time are assigned automatically.</p>
              </div>
              {activeFactories.length ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate">Factory</label>
                    <Select
                      value={selectedCreateFactoryId}
                      onChange={(e) => {
                        setSelectedCreateFactoryId(e.target.value);
                        setCreateError("");
                      }}
                    >
                      {activeFactories.map((factory) => (
                        <option key={factory.id} value={factory.id}>
                          {factory.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-ink/8 pt-3">
                    <p className="text-xs text-slate">New factories appear here automatically after refresh.</p>
                    <Button onClick={handleCreateVoucher} disabled={createMutation.isPending || !selectedCreateFactoryId}>
                      {createMutation.isPending ? "Creating..." : "Create Voucher"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-ink/8 bg-white/70 px-3 py-3 text-sm text-slate">
                  No active factories available. Add or activate a factory in Settings first.
                </div>
              )}
            </div>
          </RoleGate>
        </div>

        {createError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm text-red-700">{createError}</p>
          </div>
        )}

        {pageError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm text-red-700">{pageError}</p>
          </div>
        )}

        <div className="hidden sm:block">
          <Table>
            <THead>
              <TR>
                <TH>Voucher</TH>
                <TH>Status</TH>
                <TH>Factory</TH>
                <TH>Created At</TH>
                <TH>Issued At</TH>
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
                  <TD className="text-slate">{formatDateTime(batch.created_at)}</TD>
                  <TD className="text-slate">{formatDateTime(batch.dispatch_date)}</TD>
                  <TD>{batch.item_count}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedBatchId(batch.id)}>
                        Open
                      </Button>
                      <RoleGate roles={["Admin"]}>
                        {batch.status === "CREATED" && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteVoucher(batch)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending && deletingBatchId === batch.id ? "Deleting..." : "Delete"}
                          </Button>
                        )}
                      </RoleGate>
                    </div>
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
                <MobileTableRow label="Created">
                  {formatDateTime(batch.created_at)}
                </MobileTableRow>
                <MobileTableRow label="Issued">
                  {formatDateTime(batch.dispatch_date)}
                </MobileTableRow>
              </div>
              <div className="mt-3 border-t border-ink/6 pt-3">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedBatchId(batch.id)}
                  >
                    Open Voucher
                  </Button>
                  <RoleGate roles={["Admin"]}>
                    {batch.status === "CREATED" && (
                      <Button
                        variant="danger"
                        size="sm"
                        className="w-full"
                        onClick={() => handleDeleteVoucher(batch)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending && deletingBatchId === batch.id ? "Deleting..." : "Delete Voucher"}
                      </Button>
                    )}
                  </RoleGate>
                </div>
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
