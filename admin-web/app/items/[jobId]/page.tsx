"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { useMutation, useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { RoleGate, useAuth } from "@/lib/auth";
import { formatInr } from "@/lib/format";
import { getApiBaseUrl } from "@/lib/apiBase";
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

const API_BASE_URL = getApiBaseUrl();

const resolvePhotoUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return url;
};

function EditJobModal({
  job,
  onClose,
  onSuccess
}: {
  job: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { request } = useApi();
  const [formData, setFormData] = useState({
    customer_name: job.customer_name || "",
    customer_phone: job.customer_phone || "",
    item_description: job.item_description || "",
    item_source: job.item_source || "",
    repair_type: job.repair_type || "",
    work_narration: job.work_narration || "",
    target_return_date: job.target_return_date ? new Date(job.target_return_date).toISOString().slice(0, 10) : "",
    factory_id: job.factory_id || "",
    diamond_cent: job.diamond_cent?.toString() || "",
    approximate_weight: job.approximate_weight?.toString() || "",
    purchase_value: job.purchase_value?.toString() || "",
    notes: job.notes || "",
    reason: ""
  });
  const [error, setError] = useState("");
  const factoriesQuery = useQuery({
    queryKey: ["factories"],
    queryFn: () => request<any[]>("/factories")
  });
  const factories = factoriesQuery.data || [];

  const updateMutation = useMutation({
    mutationFn: () =>
      request(`/jobs/${job.job_id}`, {
        method: "PATCH",
        body: JSON.stringify({
          customer_name: formData.customer_name || null,
          customer_phone: formData.customer_phone || null,
          item_description: formData.item_description,
          approximate_weight: formData.approximate_weight ? parseFloat(formData.approximate_weight) : null,
          purchase_value: formData.purchase_value ? parseFloat(formData.purchase_value) : null,
          item_source: formData.item_source || null,
          repair_type: formData.repair_type || null,
          work_narration: formData.work_narration || null,
          target_return_date: formData.target_return_date ? new Date(formData.target_return_date).toISOString() : null,
          factory_id: formData.factory_id || null,
          diamond_cent: formData.diamond_cent ? parseFloat(formData.diamond_cent) : null,
          notes: formData.notes || null,
          reason: formData.reason
        })
      }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: () => {
      setError("Failed to update job");
    }
  });

  const handleSubmit = () => {
    setError("");
    if (!formData.item_description.trim()) {
      setError("Item description is required");
      return;
    }
    if (!formData.reason.trim()) {
      setError("Edit reason is required");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white/95 p-6 shadow-[var(--shadow)]">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Edit Job</p>
          <h2 className="mt-2 text-lg font-semibold font-display">Edit Job: {job.job_id}</h2>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Item Source</label>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Repair Type</label>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Target Return Date</label>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Work Narration</label>
              <Input
                placeholder="Work description"
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
              rows={2}
              placeholder="Additional notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Edit Reason *</label>
            <Input
              placeholder="Why are you editing this job?"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
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
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreateIncidentModal({
  jobId,
  onClose,
  onSuccess
}: {
  jobId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { request } = useApi();
  const [type, setType] = useState("StickerMismatch");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const incidentTypes = ["StickerMismatch", "MissingItem", "DuplicateScan", "Damage", "Other"];

  const createMutation = useMutation({
    mutationFn: () =>
      request("/incidents", {
        method: "POST",
        body: JSON.stringify({
          job_id: jobId,
          type,
          description
        })
      }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: () => {
      setError("Failed to create incident");
    }
  });

  const handleSubmit = () => {
    setError("");
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-slate">Incident</p>
        <h2 className="mt-2 text-lg font-semibold font-display">Create Incident</h2>
        <p className="mb-4 mt-2 text-sm text-slate-600">
          Report an issue for job <span className="font-medium">{jobId}</span>
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <select
              className="w-full rounded-2xl border border-ink/10 bg-white/90 px-4 py-2 text-sm outline-none transition focus:border-ink/30 focus:ring-2 focus:ring-gold/30"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {incidentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description *</label>
            <textarea
              className="w-full rounded-2xl border border-ink/10 bg-white/90 px-4 py-2 text-sm outline-none transition focus:border-ink/30 focus:ring-2 focus:ring-gold/30"
              rows={3}
              placeholder="Describe the incident"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
            {createMutation.isPending ? "Creating..." : "Create Incident"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ItemDetailPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params?.jobId as string;
  const { accessToken, isLoading } = useAuth();
  const { request, requestBlob } = useApi();
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const jobQuery = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => request<any>(`/jobs/${jobId}`),
    enabled: Boolean(jobId && accessToken && !isLoading)
  });

  const overrideMutation = useMutation({
    mutationFn: () =>
      request(`/jobs/${jobId}/scan`, {
        method: "POST",
        body: JSON.stringify({
          to_status: overrideStatus,
          override_reason: overrideReason,
          remarks: "Admin override"
        })
      }),
    onSuccess: () => {
      jobQuery.refetch();
      setOverrideStatus("");
      setOverrideReason("");
    }
  });

  const job = jobQuery.data;
  const photos = useMemo(() => {
    if (!job?.photos) return [];
    return job.photos
      .map((photo: any) => ({
        ...photo,
        resolvedUrl: resolvePhotoUrl(photo.thumb_url || photo.url || "")
      }))
      .filter((photo: any) => photo.resolvedUrl);
  }, [job?.photos]);
  const pendingSince = job?.last_scan_at || job?.created_at;
  const pendingDays = pendingSince ? Math.floor((Date.now() - new Date(pendingSince).getTime()) / 86400000) : null;
  const dispatchEvent = job?.status_events?.find((event: any) => event.to_status === "DISPATCHED_TO_FACTORY");
  const dispatchAt = dispatchEvent ? new Date(dispatchEvent.timestamp).toLocaleString() : null;

  const handleDownloadLabel = async () => {
    setDownloadError("");
    try {
      const blob = await requestBlob(`/jobs/${jobId}/label.pdf`);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `label-${jobId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      jobQuery.refetch();
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Unable to download label");
    }
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="space-y-6">
          {(jobQuery.isLoading || jobQuery.isError) && (
            <div className="rounded-2xl border border-ink/10 bg-white/80 p-3 text-sm text-slate-700">
              {jobQuery.isLoading && "Loading job details..."}
              {jobQuery.isError && (
                <div className="flex flex-col gap-2 text-red-600">
                  <span>{jobQuery.error instanceof Error ? jobQuery.error.message : "Failed to load job."}</span>
                  <button
                    className="w-fit rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300"
                    type="button"
                    onClick={() => jobQuery.refetch()}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate">Item</p>
              <h1 className="text-2xl font-semibold font-display">{job?.job_id}</h1>
            </div>
            <Badge>{statusLabel(job?.current_status)}</Badge>
          </div>

          {/* Job Details */}
          <div className="grid gap-4 rounded-3xl border border-ink/10 bg-white/80 p-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Customer</p>
              <p className="font-medium">{job?.customer_name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="font-medium">{job?.customer_phone || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Source</p>
              <p className="font-medium">{job?.item_source || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Repair Type</p>
              <p className="font-medium">{job?.repair_type || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Factory</p>
              <p className="font-medium">{job?.factory_name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Target Return</p>
              <p className="font-medium">
                {job?.target_return_date ? new Date(job.target_return_date).toLocaleDateString() : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Diamond Cent</p>
              <p className="font-medium">
                {job?.diamond_cent === null || job?.diamond_cent === undefined ? "-" : `${job.diamond_cent}c`}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Weight</p>
              <p className="font-medium">{job?.approximate_weight ? `${job.approximate_weight}g` : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Purchase Value (INR)</p>
              <p className="font-medium">{formatInr(job?.purchase_value)}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-slate-500">Description</p>
              <p className="font-medium">{job?.item_description}</p>
            </div>
            {job?.work_narration && (
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500">Work Narration</p>
                <p className="font-medium">{job.work_narration}</p>
              </div>
            )}
            {job?.notes && (
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500">Notes</p>
                <p className="font-medium">{job.notes}</p>
              </div>
            )}
          </div>

          {photos.length > 0 && (
            <div className="grid gap-3 md:grid-cols-3">
              {photos.map((photo: any) => (
                <img
                  key={photo.key}
                  src={photo.resolvedUrl}
                  alt="Item photo"
                  className="h-32 w-full rounded-2xl object-cover shadow-sm"
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center justify-center rounded-xl border border-ink/10 bg-white/80 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
              type="button"
              onClick={handleDownloadLabel}
            >
              Download Label
            </button>
            <Button variant="outline" onClick={() => setShowIncidentModal(true)}>
              Create Incident
            </Button>
            <RoleGate roles={["Admin"]}>
              <Button variant="outline" onClick={() => setShowEditModal(true)}>
                Edit Job
              </Button>
            </RoleGate>
          </div>
          {downloadError && <p className="text-sm text-red-600">{downloadError}</p>}
        </Card>

        <Card className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Holder</p>
          <p className="text-lg font-semibold">
            {job?.current_holder_username
              ? `${job.current_holder_username} (${job.current_holder_role})`
              : job?.current_holder_role}
          </p>
          <p className="text-sm text-slate">Last scan: {job?.last_scan_at ? new Date(job.last_scan_at).toLocaleString() : "-"}</p>
          <p className="text-sm text-slate">Sent to factory: {dispatchAt || "-"}</p>
          <p className="text-sm text-slate">
            Pending: {pendingDays === null ? "-" : `${pendingDays} day${pendingDays === 1 ? "" : "s"}`}
          </p>
          <RoleGate roles={["Admin"]}>
            <div className="mt-4 space-y-2 border-t border-ink/10 pt-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate">Admin Override</p>
              <select
                className="w-full rounded-2xl border border-ink/10 bg-white/90 px-4 py-2 text-sm outline-none transition focus:border-ink/30 focus:ring-2 focus:ring-gold/30"
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value)}
              >
                <option value="">Select status</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Override reason"
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
              />
              <Button
                onClick={() => overrideMutation.mutate()}
                disabled={!overrideStatus || !overrideReason || overrideMutation.isPending}
              >
                {overrideMutation.isPending ? "Applying..." : "Apply Override"}
              </Button>
            </div>
          </RoleGate>
        </Card>
      </div>

      <Card className="mt-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate">Status Timeline</p>
        <p className="mt-2 text-lg font-semibold font-display">Status Timeline</p>
        <Table className="mt-4">
          <THead>
            <TR>
              <TH>From</TH>
              <TH>To</TH>
              <TH>By</TH>
              <TH>At</TH>
              <TH>Remarks</TH>
            </TR>
          </THead>
          <TBody>
            {job?.status_events?.map((event: any) => (
              <TR key={event.id}>
                <TD>{statusLabel(event.from_status)}</TD>
                <TD>{statusLabel(event.to_status)}</TD>
                <TD>
                  {event.scanned_by_username
                    ? `${event.scanned_by_username} (${event.scanned_by_role})`
                    : event.scanned_by_role}
                </TD>
                <TD>{new Date(event.timestamp).toLocaleString()}</TD>
                <TD>{event.override_reason || event.remarks || "-"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {showEditModal && job && (
        <EditJobModal
          job={job}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => jobQuery.refetch()}
        />
      )}

      {showIncidentModal && (
        <CreateIncidentModal
          jobId={jobId}
          onClose={() => setShowIncidentModal(false)}
          onSuccess={() => {}}
        />
      )}
    </AppShell>
  );
}
