"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";

import { useMutation, useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardLabel, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR, MobileTableCard, MobileTableRow } from "@/components/ui/table";
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
const labelPositions = [1, 2, 3, 4, 5, 6];
const DEFAULT_PAGE_SIZE = 20;

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

export default function ItemsPage() {
  const { request, requestBlob } = useApi();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [downloadError, setDownloadError] = useState("");
  const [startPosition, setStartPosition] = useState(1);

  // Filters
  const [jobIdFilter, setJobIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState("last_scan_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (jobIdFilter) params.append("job_id", jobIdFilter);
    if (statusFilter) params.append("status", statusFilter);
    if (phoneFilter) params.append("phone", phoneFilter);
    if (fromDate) params.append("from_date", new Date(fromDate).toISOString());
    if (toDate) params.append("to_date", new Date(toDate).toISOString());
    params.append("sort_by", sortKey);
    params.append("sort_dir", sortOrder);
    params.append("limit", String(pageSize));
    params.append("offset", String(pageIndex * pageSize));
    return params.toString();
  };

  const jobsQuery = useQuery({
    queryKey: ["jobs", jobIdFilter, statusFilter, phoneFilter, fromDate, toDate, sortKey, sortOrder, pageIndex, pageSize],
    queryFn: () => {
      const queryString = buildQueryParams();
      return request<any[]>(`/jobs?${queryString}`);
    }
  });

  const jobs = jobsQuery.data || [];

  useEffect(() => {
    setSelectedJobs((prev) => prev.filter((jobId) => jobs.some((job) => job.job_id === jobId)));
  }, [jobs]);

  useEffect(() => {
    setPageIndex(0);
  }, [jobIdFilter, statusFilter, phoneFilter, fromDate, toDate, sortKey, sortOrder, pageSize]);

  const clearFilters = () => {
    setJobIdFilter("");
    setStatusFilter("");
    setPhoneFilter("");
    setFromDate("");
    setToDate("");
  };

  const hasFilters = jobIdFilter || statusFilter || phoneFilter || fromDate || toDate;
  const totalJobs = jobs.length;
  const totalPages = Math.max(1, Math.ceil(totalJobs / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const pageStart = safePageIndex * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, totalJobs);
  const pageJobs = jobs;

  const allSelected = pageJobs.length > 0 && pageJobs.every((job) => selectedJobs.includes(job.job_id));
  const selectedLabelCount = selectedJobs.length;

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
    const selectedJobIds = jobs.filter((job) => selectedJobs.includes(job.job_id)).map((job) => job.job_id);
    if (!selectedJobIds.length) return;
    setDownloadError("");
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
      setDownloadError(error instanceof Error ? error.message : "Unable to download labels");
    }
  };

  const handlePrintLabels = async () => {
    const selectedJobIds = jobs.filter((job) => selectedJobs.includes(job.job_id)).map((job) => job.job_id);
    if (!selectedJobIds.length) return;
    setDownloadError("");
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setDownloadError("Pop-up blocked. Allow pop-ups to print labels.");
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
      setDownloadError(error instanceof Error ? error.message : "Unable to print labels");
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
                  disabled={!selectedLabelCount}
                >
                  {selectedLabelCount ? `Download ${selectedLabelCount} (A4)` : "Download A4"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintLabels}
                  disabled={!selectedLabelCount}
                >
                  {selectedLabelCount ? `Print ${selectedLabelCount} (A4)` : "Print A4"}
                </Button>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              + Create Job
            </Button>
          </div>
        </div>
        {downloadError && <p className="text-sm text-red-600">{downloadError}</p>}

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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
                    <TD className="font-medium">{job.job_id}</TD>
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
            {totalJobs
              ? `Showing ${pageStart + 1}-${pageEnd} • Page ${safePageIndex + 1}`
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
              disabled={safePageIndex === 0}
            >
              First
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              disabled={safePageIndex === 0}
            >
              Prev
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((index) => Math.abs(index - safePageIndex) <= 2 || index === 0 || index === totalPages - 1)
              .map((index, idx, arr) => {
                const prev = arr[idx - 1];
                const showGap = idx > 0 && index - prev > 1;
                return (
                  <span key={`page-${index}`} className="flex items-center gap-1">
                    {showGap && <span className="px-2 text-xs text-slate">…</span>}
                    <Button
                      variant={index === safePageIndex ? "outline" : "ghost"}
                      size="sm"
                      onClick={() => setPageIndex(index)}
                    >
                      {index + 1}
                    </Button>
                  </span>
                );
              })}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageIndex((prev) => Math.min(prev + 1, totalPages - 1))}
              disabled={safePageIndex >= totalPages - 1}
            >
              Next
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageIndex(totalPages - 1)}
              disabled={safePageIndex >= totalPages - 1}
            >
              Last
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
