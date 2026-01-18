"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";

import { useMutation, useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { statusLabel } from "@/lib/status";
import { useApi } from "@/lib/useApi";

const statuses = [
  "PURCHASED",
  "PACKED_READY",
  "DISPATCHED_TO_FACTORY",
  "RECEIVED_AT_FACTORY",
  "RETURNED_FROM_FACTORY",
  "RECEIVED_AT_SHOP",
  "ADDED_TO_STOCK",
  "HANDED_TO_DELIVERY",
  "DELIVERED_TO_CUSTOMER",
  "ON_HOLD",
  "CANCELLED"
];

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
    onError: () => {
      setError("Failed to create job");
    }
  });

  const handleSubmit = () => {
    setError("");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white/95 p-6 shadow-[var(--shadow)]">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">New Job</p>
          <h2 className="mt-2 text-lg font-semibold font-display">Create New Job</h2>
          <p className="mt-2 text-sm text-slate">Capture item details and start the chain of custody.</p>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Customer Name</label>
              <Input
                placeholder="Customer name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <Input
                placeholder="Phone number"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Item Description *</label>
            <Input
              placeholder="Describe the item"
              value={formData.item_description}
              onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Item Source *</label>
              <select
                className="w-full rounded-2xl border border-ink/10 bg-white/90 px-4 py-2 text-sm outline-none transition focus:border-ink/30 focus:ring-2 focus:ring-gold/30"
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
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Diamond Cent</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Diamond cent"
                value={formData.diamond_cent}
                onChange={(e) => setFormData({ ...formData, diamond_cent: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Repair Type *</label>
              <select
                className="w-full rounded-2xl border border-ink/10 bg-white/90 px-4 py-2 text-sm outline-none transition focus:border-ink/30 focus:ring-2 focus:ring-gold/30"
                value={formData.repair_type}
                onChange={(e) => setFormData({ ...formData, repair_type: e.target.value })}
              >
                <option value="">Select repair type</option>
                <option value="Customer Repair">Customer Repair</option>
                <option value="Stock Repair">Stock Repair</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Target Return Date *</label>
              <Input
                type="date"
                value={formData.target_return_date}
                onChange={(e) => setFormData({ ...formData, target_return_date: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Factory</label>
              <select
                className="w-full rounded-2xl border border-ink/10 bg-white/90 px-4 py-2 text-sm outline-none transition focus:border-ink/30 focus:ring-2 focus:ring-gold/30"
                value={formData.factory_id}
                onChange={(e) => setFormData({ ...formData, factory_id: e.target.value })}
              >
                <option value="">{factories.length ? "Select factory" : "No factories available"}</option>
                {factories.map((factory) => (
                  <option key={factory.id} value={factory.id}>
                    {factory.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Work Narration *</label>
              <Input
                placeholder="e.g. polishing"
                value={formData.work_narration}
                onChange={(e) => setFormData({ ...formData, work_narration: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Weight (g)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Approximate weight"
                value={formData.approximate_weight}
                onChange={(e) => setFormData({ ...formData, approximate_weight: e.target.value })}
              />
            </div>
            <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Purchase Value (INR)</label>
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              className="w-full rounded-2xl border border-ink/10 bg-white/90 px-4 py-2 text-sm outline-none transition focus:border-ink/30 focus:ring-2 focus:ring-gold/30"
              rows={3}
              placeholder="Additional notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Item Photos *</label>
            <input
              className="w-full text-sm"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
            />
            {photoPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {photoPreviews.map((src, index) => (
                  <div key={src} className="relative">
                    <img src={src} alt="Preview" className="h-20 w-full rounded-xl object-cover" />
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded-full bg-white/80 px-2 text-xs"
                      onClick={() => removePhoto(index)}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-slate transition hover:border-ink/30 hover:text-ink"
            onClick={onClose}
          >
            Cancel
          </button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Job"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ItemsPage() {
  const { request } = useApi();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [jobIdFilter, setJobIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (jobIdFilter) params.append("job_id", jobIdFilter);
    if (statusFilter) params.append("status", statusFilter);
    if (phoneFilter) params.append("phone", phoneFilter);
    if (fromDate) params.append("from_date", new Date(fromDate).toISOString());
    if (toDate) params.append("to_date", new Date(toDate).toISOString());
    return params.toString();
  };

  const jobsQuery = useQuery({
    queryKey: ["jobs", jobIdFilter, statusFilter, phoneFilter, fromDate, toDate],
    queryFn: () => {
      const queryString = buildQueryParams();
      return request<any[]>(queryString ? `/jobs?${queryString}` : "/jobs");
    }
  });

  const jobs = jobsQuery.data || [];

  const clearFilters = () => {
    setJobIdFilter("");
    setStatusFilter("");
    setPhoneFilter("");
    setFromDate("");
    setToDate("");
  };

  const hasFilters = jobIdFilter || statusFilter || phoneFilter || fromDate || toDate;

  return (
    <AppShell>
      <Card className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate">Items</p>
            <h1 className="text-2xl font-semibold font-display">Search & Track</h1>
            <p className="mt-2 text-sm text-slate">Find, filter, and open every item record in seconds.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              + Create Job
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="rounded-3xl border border-ink/10 bg-white/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-[0.3em] text-slate">Filters</h3>
              {hasFilters && (
                <button
                  className="text-xs font-semibold text-ink hover:underline"
                  onClick={clearFilters}
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs text-slate-600">Job ID</label>
                <Input
                  placeholder="Search job ID"
                  value={jobIdFilter}
                  onChange={(e) => setJobIdFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-600">Status</label>
                <select
                  className="w-full rounded-2xl border border-ink/10 bg-white/90 px-4 py-2 text-sm outline-none transition focus:border-ink/30 focus:ring-2 focus:ring-gold/30"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-600">Phone</label>
                <Input
                  placeholder="Customer phone"
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-600">From Date</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-600">To Date</label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <Table>
          <THead>
            <TR>
              <TH>Job ID</TH>
              <TH>Customer</TH>
              <TH>Status</TH>
              <TH>Holder</TH>
              <TH>Last Scan</TH>
              <TH>Action</TH>
            </TR>
          </THead>
          <TBody>
            {jobs.map((job) => (
              <TR key={job.job_id}>
                <TD>{job.job_id}</TD>
                <TD>
                  <div>
                    <div className="font-medium">{job.customer_name || "-"}</div>
                    {job.customer_phone && (
                      <div className="text-xs text-slate-500">{job.customer_phone}</div>
                    )}
                  </div>
                </TD>
                <TD>
                  <Badge>{statusLabel(job.current_status)}</Badge>
                </TD>
                <TD>{job.current_holder_role}</TD>
                <TD>{job.last_scan_at ? new Date(job.last_scan_at).toLocaleString() : "-"}</TD>
                <TD>
                  <Link className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-ink/30" href={`/items/${job.job_id}`}>
                    View
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {!jobs.length && <p className="text-sm text-slate">No matching jobs.</p>}
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
