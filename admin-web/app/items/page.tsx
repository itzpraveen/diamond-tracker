"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useMutation, useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardLabel, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR, MobileTableCard, MobileTableRow } from "@/components/ui/table";
import { RoleGate } from "@/lib/auth";
import { statusLabel } from "@/lib/status";
import { useApi } from "@/lib/useApi";

const statuses = [
  "PURCHASED",
  "PACKED_READY",
  "DISPATCHED_TO_FACTORY",
  "RECEIVED_AT_SHOP",
  "ADDED_TO_STOCK",
  "HANDED_TO_DELIVERY",
  "DELIVERED_TO_CUSTOMER",
  "ON_HOLD",
  "CANCELLED"
];
const terminalStatuses = new Set(["DELIVERED_TO_CUSTOMER", "CANCELLED"]);
const labelPositions = [1, 2, 3, 4, 5, 6];
const DEFAULT_PAGE_SIZE = 20;
const attentionOptions = [
  { value: "", label: "All operational items", description: "Show the full items list." },
  { value: "overdue_returns", label: "Overdue returns", description: "Items already past target return date." },
  { value: "aged_over_7", label: "Aged over 7 days", description: "Items sitting too long without movement." },
  { value: "at_factory", label: "Currently at factory", description: "Items still in the factory pipeline." },
  { value: "awaiting_closure", label: "Awaiting closure", description: "Returned or ready items still pending final closure." }
] as const;

function toDateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function CreateJobModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { request } = useApi();
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    item_description: "",
    item_source: "",
    repair_type: "",
    work_narration: "",
    target_return_date: "",
    factory_id: "",
    diamond_cent: "",
    approximate_weight: "",
    purchase_value: "",
    voucher_no: "",
    style_number: "",
    card_weight: "",
    notes: ""
  });
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    previewUrlsRef.current = photoPreviews;
  }, [photoPreviews]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const createMutation = useMutation({
    mutationFn: async () => {
      const uploadedPhotos = await Promise.all(
        photos.map((file) => {
          const formData = new FormData();
          formData.append("file", file);
          return request<any>("/uploads/image", {
            method: "POST",
            body: formData
          });
        })
      );
      return request("/jobs", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          approximate_weight: formData.approximate_weight ? parseFloat(formData.approximate_weight) : null,
          purchase_value: formData.purchase_value ? parseFloat(formData.purchase_value) : null,
          voucher_no: formData.voucher_no || null,
          item_source: formData.item_source,
          repair_type: formData.repair_type || null,
          work_narration: formData.work_narration || null,
          target_return_date: formData.target_return_date ? new Date(formData.target_return_date).toISOString() : null,
          factory_id: formData.factory_id || null,
          diamond_cent: formData.diamond_cent ? parseFloat(formData.diamond_cent) : null,
          style_number: formData.style_number || null,
          card_weight: formData.card_weight ? parseFloat(formData.card_weight) : null,
          photos: uploadedPhotos
        })
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message) {
        setError(err.message);
        return;
      }
      setError("Failed to create job");
    }
  });

  const handleSubmit = () => {
    setError("");
    if (!formData.voucher_no.trim()) {
      setError("Voucher number is required");
      return;
    }
    if (!formData.item_description.trim()) {
      setError("Item description is required");
      return;
    }
    if (!formData.item_source) {
      setError("Item source is required");
      return;
    }
    if (!formData.repair_type) {
      setError("Repair type is required");
      return;
    }
    if (!formData.work_narration.trim()) {
      setError("Work narration is required");
      return;
    }
    if (!formData.target_return_date) {
      setError("Target return date is required");
      return;
    }
    if (!formData.factory_id && factories.length) {
      setError("Factory is required");
      return;
    }
    if (!photos.length) {
      setError("At least one photo is required");
      return;
    }
    createMutation.mutate();
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setPhotos((prev) => [...prev, ...files]);
    setPhotoPreviews((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))]);
    event.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
    setPhotoPreviews((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return next;
    });
  };

  const factoriesQuery = useQuery({
    queryKey: ["factories"],
    queryFn: () => request<any[]>("/factories")
  });
  const factories = factoriesQuery.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-[var(--shadow-lg)] sm:max-w-lg sm:rounded-2xl sm:p-6">
        <div className="mb-5">
          <CardLabel>New Job</CardLabel>
          <CardTitle className="mt-1">Create New Job</CardTitle>
          <CardDescription>Capture item details and start the chain of custody.</CardDescription>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Voucher No <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Voucher number"
              value={formData.voucher_no}
              onChange={(e) => setFormData({ ...formData, voucher_no: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Customer Name</label>
              <Input
                placeholder="Customer name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone</label>
              <Input
                placeholder="Phone number"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Item Description <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Describe the item"
              value={formData.item_description}
              onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Item Source <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.item_source}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    item_source: e.target.value,
                    repair_type:
                      prev.repair_type ||
                      (e.target.value === "Repair"
                        ? "Customer Repair"
                        : e.target.value === "Stock"
                          ? "Stock Repair"
                          : "")
                  }))
                }
              >
                <option value="">Select source</option>
                <option value="Stock">Stock (new purchase)</option>
                <option value="Repair">Repair (customer)</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Diamond Cent</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Diamond cent"
                value={formData.diamond_cent}
                onChange={(e) => setFormData({ ...formData, diamond_cent: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Repair Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.repair_type}
                onChange={(e) => setFormData({ ...formData, repair_type: e.target.value })}
              >
                <option value="">Select repair type</option>
                <option value="Customer Repair">Customer Repair</option>
                <option value="Stock Repair">Stock Repair</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Target Return Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.target_return_date}
                onChange={(e) => setFormData({ ...formData, target_return_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Factory {factories.length ? <span className="text-red-500">*</span> : null}
              </label>
              <Select
                value={formData.factory_id}
                onChange={(e) => setFormData({ ...formData, factory_id: e.target.value })}
              >
                <option value="">{factories.length ? "Select factory" : "No factories available"}</option>
                {factories.map((factory) => (
                  <option key={factory.id} value={factory.id}>
                    {factory.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Work Narration <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. polishing"
                value={formData.work_narration}
                onChange={(e) => setFormData({ ...formData, work_narration: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Weight (g)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Approximate weight"
                value={formData.approximate_weight}
                onChange={(e) => setFormData({ ...formData, approximate_weight: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Purchase Value (INR)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Value"
                value={formData.purchase_value}
                onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Style Number</label>
              <Input
                placeholder="Style number"
                value={formData.style_number}
                onChange={(e) => setFormData({ ...formData, style_number: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Card Weight (g)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Card weight"
                value={formData.card_weight}
                onChange={(e) => setFormData({ ...formData, card_weight: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Notes</label>
            <Textarea
              rows={3}
              placeholder="Additional notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Item Photos <span className="text-red-500">*</span>
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/15 bg-sand/30 px-4 py-6 text-sm text-slate transition hover:border-ink/25 hover:bg-sand/50">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add photos</span>
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
              />
            </label>
            {photoPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photoPreviews.map((src, index) => (
                  <div key={src} className="group relative aspect-square">
                    <img src={src} alt="Preview" className="h-full w-full rounded-lg object-cover" />
                    <button
                      type="button"
                      className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white opacity-0 transition group-hover:opacity-100"
                      onClick={() => removePhoto(index)}
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Job"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ItemsPageContent() {
  const { request, requestBlob } = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [actionError, setActionError] = useState("");
  const [startPosition, setStartPosition] = useState(1);

  // Filters
  const [jobIdFilter, setJobIdFilter] = useState(() => searchParams.get("job_id") ?? "");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "");
  const [phoneFilter, setPhoneFilter] = useState(() => searchParams.get("phone") ?? "");
  const [factoryFilter, setFactoryFilter] = useState(() => searchParams.get("factory_id") ?? "");
  const [attentionFilter, setAttentionFilter] = useState(() => searchParams.get("attention") ?? "");
  const [fromDate, setFromDate] = useState(() => toDateInputValue(searchParams.get("from_date")));
  const [toDate, setToDate] = useState(() => toDateInputValue(searchParams.get("to_date")));
  const [showFilters, setShowFilters] = useState(
    () =>
      Boolean(
        searchParams.get("job_id") ||
          searchParams.get("status") ||
          searchParams.get("phone") ||
          searchParams.get("factory_id") ||
          searchParams.get("attention") ||
          searchParams.get("from_date") ||
          searchParams.get("to_date")
      )
  );
  const [showArchived, setShowArchived] = useState(() => searchParams.get("include_archived") === "true");
  const [sortKey, setSortKey] = useState("last_scan_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (jobIdFilter) params.append("job_id", jobIdFilter);
    if (statusFilter) params.append("status", statusFilter);
    if (phoneFilter) params.append("phone", phoneFilter);
    if (attentionFilter) params.append("attention", attentionFilter);
    if (fromDate) params.append("from_date", new Date(fromDate).toISOString());
    if (toDate) params.append("to_date", new Date(toDate).toISOString());
    if (factoryFilter) params.append("factory_id", factoryFilter);
    if (showArchived) params.append("include_archived", "true");
    params.append("sort_by", sortKey);
    params.append("sort_dir", sortOrder);
    params.append("limit", String(pageSize));
    params.append("offset", String(pageIndex * pageSize));
    return params.toString();
  };

  const jobsQuery = useQuery({
    queryKey: ["jobs", jobIdFilter, statusFilter, phoneFilter, factoryFilter, attentionFilter, fromDate, toDate, showArchived, sortKey, sortOrder, pageIndex, pageSize],
    queryFn: () => {
      const queryString = buildQueryParams();
      return request<any[]>(`/jobs?${queryString}`);
    }
  });

  const factoriesQuery = useQuery({
    queryKey: ["factories"],
    queryFn: () => request<any[]>("/factories")
  });
  const factories = factoriesQuery.data || [];

  const jobs = jobsQuery.data || [];

  useEffect(() => {
    setSelectedJobs((prev) => prev.filter((jobId) => jobs.some((job) => job.job_id === jobId)));
  }, [jobs]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (jobIdFilter) params.set("job_id", jobIdFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (phoneFilter) params.set("phone", phoneFilter);
    if (factoryFilter) params.set("factory_id", factoryFilter);
    if (attentionFilter) params.set("attention", attentionFilter);
    if (fromDate) params.set("from_date", new Date(fromDate).toISOString());
    if (toDate) params.set("to_date", new Date(toDate).toISOString());
    if (showArchived) params.set("include_archived", "true");
    const nextPath = params.toString() ? `/items?${params.toString()}` : "/items";
    router.replace(nextPath, { scroll: false });
  }, [attentionFilter, factoryFilter, fromDate, jobIdFilter, phoneFilter, router, showArchived, statusFilter, toDate]);

  useEffect(() => {
    setPageIndex(0);
  }, [jobIdFilter, statusFilter, phoneFilter, factoryFilter, attentionFilter, fromDate, toDate, showArchived, sortKey, sortOrder, pageSize]);

  const clearFilters = () => {
    setJobIdFilter("");
    setStatusFilter("");
    setPhoneFilter("");
    setFactoryFilter("");
    setAttentionFilter("");
    setFromDate("");
    setToDate("");
  };

  const attentionCopy =
    attentionOptions.find((option) => option.value === attentionFilter) || attentionOptions[0];
  const hasFilters = jobIdFilter || statusFilter || phoneFilter || factoryFilter || attentionFilter || fromDate || toDate;
  const hasMore = jobs.length >= pageSize;
  const pageJobs = jobs;

  const allSelected = pageJobs.length > 0 && pageJobs.every((job) => selectedJobs.includes(job.job_id));
  const selectedCount = selectedJobs.length;
  const selectedJobRecords = useMemo(
    () => jobs.filter((job) => selectedJobs.includes(job.job_id)),
    [jobs, selectedJobs]
  );
  const selectedJobIds = useMemo(() => selectedJobRecords.map((job) => job.job_id), [selectedJobRecords]);
  const allSelectedArchived = selectedJobRecords.length > 0 && selectedJobRecords.every((job) => job.is_archived);
  const allSelectedActive = selectedJobRecords.length > 0 && selectedJobRecords.every((job) => !job.is_archived);
  const canBulkCancel =
    allSelectedActive && selectedJobRecords.every((job) => !terminalStatuses.has(job.current_status));
  const canBulkArchive =
    allSelectedActive && selectedJobRecords.every((job) => terminalStatuses.has(job.current_status));
  const canBulkRestore = allSelectedArchived;
  const canGenerateLabels = selectedJobRecords.length > 0 && selectedJobRecords.every((job) => !job.is_archived);

  const cancelMutation = useMutation({
    mutationFn: async ({ jobIds, reason }: { jobIds: string[]; reason: string }) =>
      request<{ updated_job_ids: string[]; missing_job_ids: string[] }>("/jobs/bulk/cancel", {
        method: "POST",
        body: JSON.stringify({ job_ids: jobIds, reason })
      }),
    onSuccess: () => {
      setSelectedJobs([]);
      setActionError("");
      jobsQuery.refetch();
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Unable to cancel selected jobs");
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async (jobIds: string[]) =>
      request<{ updated_job_ids: string[]; missing_job_ids: string[] }>("/jobs/bulk/archive", {
        method: "POST",
        body: JSON.stringify({ job_ids: jobIds })
      }),
    onSuccess: () => {
      setSelectedJobs([]);
      setActionError("");
      jobsQuery.refetch();
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Unable to archive selected jobs");
    }
  });

  const restoreMutation = useMutation({
    mutationFn: async (jobIds: string[]) =>
      request<{ updated_job_ids: string[]; missing_job_ids: string[] }>("/jobs/bulk/restore", {
        method: "POST",
        body: JSON.stringify({ job_ids: jobIds })
      }),
    onSuccess: () => {
      setSelectedJobs([]);
      setActionError("");
      jobsQuery.refetch();
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Unable to restore selected jobs");
    }
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortOrder(key === "last_scan_at" || key === "created_at" ? "desc" : "asc");
  };

  const sortIndicator = (key: string) => {
    if (sortKey !== key) return "";
    return sortOrder === "asc" ? "^" : "v";
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedJobs((prev) => {
      if (checked) {
        const next = new Set(prev);
        pageJobs.forEach((job) => next.add(job.job_id));
        return Array.from(next);
      }
      const pageIds = new Set(pageJobs.map((job) => job.job_id));
      return prev.filter((jobId) => !pageIds.has(jobId));
    });
  };

  const toggleJobSelection = (jobId: string, checked: boolean) => {
    setSelectedJobs((prev) => (checked ? Array.from(new Set([...prev, jobId])) : prev.filter((id) => id !== jobId)));
  };

  const handleDownloadLabels = async () => {
    if (!selectedJobIds.length) return;
    setActionError("");
    try {
      const blob = await requestBlob("/jobs/labels.pdf", {
        method: "POST",
        body: JSON.stringify({ job_ids: selectedJobIds, start_position: startPosition })
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `labels-a4-${selectedJobIds.length}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      jobsQuery.refetch();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to download labels");
    }
  };

  const handlePrintLabels = async () => {
    if (!selectedJobIds.length) return;
    setActionError("");
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setActionError("Pop-up blocked. Allow pop-ups to print labels.");
      return;
    }
    printWindow.document.write(
      `<html><head><title>Print Labels</title><style>html,body{margin:0;height:100%;}body{font-family:system-ui, sans-serif;display:flex;align-items:center;justify-content:center;color:#4b5563;}iframe{border:0;width:100%;height:100%;}</style></head><body><div id="print-status">Preparing labels...</div></body></html>`
    );
    printWindow.document.close();
    try {
      const blob = await requestBlob("/jobs/labels.pdf", {
        method: "POST",
        body: JSON.stringify({ job_ids: selectedJobIds, start_position: startPosition })
      });
      const url = window.URL.createObjectURL(blob);
      const triggerPrint = () => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          // Ignore print errors; user can print manually.
        }
      };
      const fallbackTimer = window.setTimeout(triggerPrint, 1200);
      printWindow.addEventListener("load", () => {
        window.clearTimeout(fallbackTimer);
        triggerPrint();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      });
      printWindow.location.href = url;
      jobsQuery.refetch();
    } catch (error) {
      printWindow.close();
      setActionError(error instanceof Error ? error.message : "Unable to print labels");
    }
  };

  const handleDownloadExcel = async () => {
    if (!selectedJobIds.length) return;
    setActionError("");
    try {
      const blob = await requestBlob("/reports/export.xlsx", {
        method: "POST",
        body: JSON.stringify({ job_ids: selectedJobIds })
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `items-export-${selectedJobIds.length}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to download Excel");
    }
  };

  const handleCancelSelected = async () => {
    if (!selectedJobIds.length || cancelMutation.isPending || !canBulkCancel) return;
    const confirmed = window.confirm(
      `Cancel ${selectedJobIds.length} selected job${selectedJobIds.length === 1 ? "" : "s"}?\n\nCancelled items remain in history and can be archived later.`
    );
    if (!confirmed) return;
    const reason = window.prompt("Cancellation reason");
    if (reason === null) return;
    if (!reason.trim()) {
      setActionError("Cancellation reason is required");
      return;
    }
    setActionError("");
    try {
      await cancelMutation.mutateAsync({ jobIds: selectedJobIds, reason: reason.trim() });
    } catch {
      // Error state is handled by the mutation callback.
    }
  };

  const handleArchiveSelected = async () => {
    if (!selectedJobIds.length || archiveMutation.isPending || !canBulkArchive) return;
    const confirmed = window.confirm(
      `Archive ${selectedJobIds.length} selected item${selectedJobIds.length === 1 ? "" : "s"}?\n\nArchived items are hidden from the default list and can be restored later.`
    );
    if (!confirmed) return;
    setActionError("");
    try {
      await archiveMutation.mutateAsync(selectedJobIds);
    } catch {
      // Error state is handled by the mutation callback.
    }
  };

  const handleRestoreSelected = async () => {
    if (!selectedJobIds.length || restoreMutation.isPending || !canBulkRestore) return;
    const confirmed = window.confirm(
      `Restore ${selectedJobIds.length} archived item${selectedJobIds.length === 1 ? "" : "s"} to the active list?`
    );
    if (!confirmed) return;
    setActionError("");
    try {
      await restoreMutation.mutateAsync(selectedJobIds);
    } catch {
      // Error state is handled by the mutation callback.
    }
  };

  return (
    <AppShell>
      <Card className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardLabel>Items</CardLabel>
            <CardTitle>Search & Track</CardTitle>
            <CardDescription>Find, filter, and open every item record in seconds.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? "Hide Filters" : "Filters"}
            </Button>
            <RoleGate roles={["Admin"]}>
              <Button
                variant={showArchived ? "primary" : "outline"}
                size="sm"
                onClick={() => setShowArchived((current) => !current)}
              >
                {showArchived ? "Hide Archived" : "Show Archived"}
              </Button>
            </RoleGate>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 shadow-[0_6px_18px_rgba(15,23,20,0.06)]">
              <div className="flex items-center gap-3 pr-3 sm:border-r sm:border-ink/10">
                <div className="leading-tight">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate/70">
                    Start Position
                  </p>
                  <p className="text-xs font-semibold text-ink">A4 • 2x3 sheet</p>
                </div>
                <div className="grid grid-cols-2 gap-1" role="group" aria-label="Start position">
                  {labelPositions.map((position) => {
                    const isSelected = startPosition === position;
                    return (
                      <button
                        key={position}
                        type="button"
                        className={`h-7 w-7 rounded-lg border text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 ${
                          isSelected
                            ? "border-forest bg-forest text-white shadow-[0_4px_10px_rgba(15,61,51,0.2)]"
                            : "border-ink/15 bg-white text-slate-600 hover:border-ink/30"
                        }`}
                        aria-pressed={isSelected}
                        aria-label={`Start at position ${position}`}
                        onClick={() => setStartPosition(position)}
                      >
                        {position}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadLabels}
                  disabled={!canGenerateLabels}
                >
                  {selectedCount ? `Download ${selectedCount} (A4)` : "Download A4"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintLabels}
                  disabled={!canGenerateLabels}
                >
                  {selectedCount ? `Print ${selectedCount} (A4)` : "Print A4"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadExcel}
                  disabled={!selectedCount}
                >
                  {selectedCount ? `Excel ${selectedCount}` : "Excel"}
                </Button>
                <RoleGate roles={["Admin"]}>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleCancelSelected}
                    disabled={!selectedCount || !canBulkCancel || cancelMutation.isPending}
                  >
                    {cancelMutation.isPending
                      ? "Cancelling..."
                      : selectedCount
                        ? `Cancel ${selectedCount}`
                        : "Cancel"}
                  </Button>
                  {allSelectedArchived ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRestoreSelected}
                      disabled={!selectedCount || !canBulkRestore || restoreMutation.isPending}
                    >
                      {restoreMutation.isPending
                        ? "Restoring..."
                        : selectedCount
                          ? `Restore ${selectedCount}`
                          : "Restore"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleArchiveSelected}
                      disabled={!selectedCount || !canBulkArchive || archiveMutation.isPending}
                    >
                      {archiveMutation.isPending
                        ? "Archiving..."
                        : selectedCount
                          ? `Archive ${selectedCount}`
                          : "Archive"}
                    </Button>
                  )}
                </RoleGate>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              + Create Job
            </Button>
          </div>
        </div>
        <RoleGate roles={["Admin"]}>
          <p className="text-xs text-slate">
            Cancel active items first. Archive only cancelled or delivered items. Archived items stay hidden until restored.
          </p>
        </RoleGate>
        {actionError && <p className="text-sm text-red-600">{actionError}</p>}
        {attentionFilter && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-700">Dashboard Focus</p>
              <p className="mt-1 text-sm font-semibold text-ink">{attentionCopy.label}</p>
              <p className="mt-1 text-xs text-slate">{attentionCopy.description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAttentionFilter("")}
            >
              Clear Focus
            </Button>
          </div>
        )}

        {/* Filters Section */}
        {showFilters && (
          <div className="rounded-xl border border-ink/8 bg-sand/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate">Filters</h3>
              {hasFilters && (
                <button
                  className="text-xs font-medium text-forest hover:underline"
                  onClick={clearFilters}
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate">Job ID</label>
                <Input
                  placeholder="Search job ID"
                  value={jobIdFilter}
                  onChange={(e) => setJobIdFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate">Status</label>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate">Factory</label>
                <Select
                  value={factoryFilter}
                  onChange={(e) => setFactoryFilter(e.target.value)}
                >
                  <option value="">All Factories</option>
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate">Focus</label>
                <Select
                  value={attentionFilter}
                  onChange={(e) => setAttentionFilter(e.target.value)}
                >
                  {attentionOptions.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate">Phone</label>
                <Input
                  placeholder="Customer phone"
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate">From Date</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate">To Date</label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden sm:block">
          <Table>
            <THead>
              <TR>
                <TH className="w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-forest"
                    checked={allSelected}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                    aria-label="Select all jobs"
                  />
                </TH>
                <TH>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-slate/80 hover:text-ink"
                    onClick={() => handleSort("job_id")}
                  >
                    Job ID
                    <span className="text-[11px] text-slate/50 group-hover:text-slate/70">
                      {sortIndicator("job_id")}
                    </span>
                  </button>
                </TH>
                <TH>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-slate/80 hover:text-ink"
                    onClick={() => handleSort("customer_name")}
                  >
                    Customer
                    <span className="text-[11px] text-slate/50 group-hover:text-slate/70">
                      {sortIndicator("customer_name")}
                    </span>
                  </button>
                </TH>
                <TH>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-slate/80 hover:text-ink"
                    onClick={() => handleSort("current_status")}
                  >
                    Status
                    <span className="text-[11px] text-slate/50 group-hover:text-slate/70">
                      {sortIndicator("current_status")}
                    </span>
                  </button>
                </TH>
                <TH>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-slate/80 hover:text-ink"
                    onClick={() => handleSort("current_holder_role")}
                  >
                    Holder
                    <span className="text-[11px] text-slate/50 group-hover:text-slate/70">
                      {sortIndicator("current_holder_role")}
                    </span>
                  </button>
                </TH>
                <TH>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-slate/80 hover:text-ink"
                    onClick={() => handleSort("last_scan_at")}
                  >
                    Last Scan
                    <span className="text-[11px] text-slate/50 group-hover:text-slate/70">
                      {sortIndicator("last_scan_at")}
                    </span>
                  </button>
                </TH>
                <TH>Action</TH>
              </TR>
            </THead>
            <TBody>
              {jobsQuery.isLoading ? (
                <TR>
                  <TD colSpan={7}>
                    <div className="h-10 animate-pulse rounded-xl bg-sand/70" />
                  </TD>
                </TR>
              ) : pageJobs.length ? (
                pageJobs.map((job) => (
                  <TR key={job.job_id}>
                    <TD className="w-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-forest"
                        checked={selectedJobs.includes(job.job_id)}
                        onChange={(event) => toggleJobSelection(job.job_id, event.target.checked)}
                        aria-label={`Select job ${job.job_id}`}
                      />
                    </TD>
                    <TD>
                      <div>
                        <div className="font-medium">{job.job_id}</div>
                        {job.is_archived && <div className="text-xs text-slate">Archived</div>}
                      </div>
                    </TD>
                    <TD>
                      <div>
                        <div className="font-medium">{job.customer_name || "-"}</div>
                        {job.customer_phone && (
                          <div className="text-xs text-slate">{job.customer_phone}</div>
                        )}
                      </div>
                    </TD>
                    <TD>
                      <StatusBadge status={job.current_status} />
                    </TD>
                    <TD className="text-slate">{job.current_holder_role || "-"}</TD>
                    <TD className="text-slate">
                      {job.last_scan_at ? new Date(job.last_scan_at).toLocaleString() : "-"}
                    </TD>
                    <TD>
                      <Link href={`/items/${job.job_id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </TD>
                  </TR>
                ))
              ) : (
                <TR>
                  <TD colSpan={7}>
                    <p className="text-sm text-slate">No matching jobs found.</p>
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 sm:hidden">
          {jobsQuery.isLoading ? (
            <div className="h-20 animate-pulse rounded-2xl bg-sand/70" />
          ) : pageJobs.length ? (
            pageJobs.map((job) => (
              <MobileTableCard key={job.job_id}>
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{job.job_id}</p>
                    <p className="text-sm text-slate">{job.customer_name || "No customer"}</p>
                    {job.is_archived && <p className="mt-1 text-xs text-slate">Archived</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={job.current_status} size="sm" />
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-forest"
                      checked={selectedJobs.includes(job.job_id)}
                      onChange={(event) => toggleJobSelection(job.job_id, event.target.checked)}
                      aria-label={`Select job ${job.job_id}`}
                    />
                  </div>
                </div>
                <div className="space-y-1 border-t border-ink/6 pt-3">
                  <MobileTableRow label="Phone">{job.customer_phone || "-"}</MobileTableRow>
                  <MobileTableRow label="Holder">{job.current_holder_role || "-"}</MobileTableRow>
                  <MobileTableRow label="Last Scan">
                    {job.last_scan_at ? new Date(job.last_scan_at).toLocaleDateString() : "-"}
                  </MobileTableRow>
                </div>
                <div className="mt-3 border-t border-ink/6 pt-3">
                  <Link href={`/items/${job.job_id}`}>
                    <Button variant="outline" size="sm" className="w-full">View Details</Button>
                  </Link>
                </div>
              </MobileTableCard>
            ))
          ) : (
            <div className="rounded-2xl border border-ink/10 bg-white/80 p-4 text-sm text-slate">
              No matching jobs found.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate">
            {pageJobs.length
              ? `Showing ${pageIndex * pageSize + 1}-${pageIndex * pageSize + pageJobs.length} • Page ${pageIndex + 1}`
              : "No results to paginate"}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Select
              value={String(pageSize)}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-[92px]"
            >
              {[10, 20, 30, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageIndex(0)}
              disabled={pageIndex === 0}
            >
              First
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              disabled={pageIndex === 0}
            >
              Prev
            </Button>
            <Button
              variant={true ? "outline" : "ghost"}
              size="sm"
              disabled
            >
              {pageIndex + 1}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageIndex((prev) => prev + 1)}
              disabled={!hasMore}
            >
              Next
            </Button>
          </div>
        </div>

        {!jobs.length && !jobsQuery.isLoading && null}
      </Card>

      {showCreateModal && (
        <CreateJobModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => jobsQuery.refetch()}
        />
      )}
    </AppShell>
  );
}

export default function ItemsPage() {
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
      <ItemsPageContent />
    </Suspense>
  );
}
