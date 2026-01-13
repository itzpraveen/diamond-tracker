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
import { RoleGate } from "@/lib/auth";
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
    approximate_weight: job.approximate_weight?.toString() || "",
    purchase_value: job.purchase_value?.toString() || "",
    notes: job.notes || "",
    reason: ""
  });
  const [error, setError] = useState("");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">Edit Job: {job.job_id}</h2>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Purchase Value</label>
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
              className="w-full rounded-xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
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
            className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
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
  const [type, setType] = useState("MISMATCH");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const incidentTypes = ["MISMATCH", "DAMAGE", "DUPLICATE", "MISSING", "OTHER"];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">Create Incident</h2>
        <p className="mb-4 text-sm text-slate-600">
          Report an issue for job <span className="font-medium">{jobId}</span>
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <select
              className="w-full rounded-xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
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
              className="w-full rounded-xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
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
            className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
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
  const { request } = useApi();
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  const jobQuery = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => request<any>(`/jobs/${jobId}`)
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
  const photos = job?.photos || [];

  const labelUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    return `${base}/jobs/${jobId}/label.pdf`;
  }, [jobId]);

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-slate">Item</p>
              <h1 className="text-2xl font-semibold">{job?.job_id}</h1>
            </div>
            <Badge>{job?.current_status}</Badge>
          </div>

          {/* Job Details */}
          <div className="grid gap-4 rounded-xl border border-ink/10 bg-slate-50 p-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Customer</p>
              <p className="font-medium">{job?.customer_name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="font-medium">{job?.customer_phone || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Weight</p>
              <p className="font-medium">{job?.approximate_weight ? `${job.approximate_weight}g` : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Purchase Value</p>
              <p className="font-medium">{job?.purchase_value ? `$${job.purchase_value}` : "-"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-slate-500">Description</p>
              <p className="font-medium">{job?.item_description}</p>
            </div>
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
                  src={photo.url}
                  alt="Item photo"
                  className="h-32 w-full rounded-xl object-cover"
                />
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <a
              className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-teal"
              href={labelUrl}
              target="_blank"
              rel="noreferrer"
            >
              Download Label
            </a>
            <Button variant="outline" onClick={() => setShowIncidentModal(true)}>
              Create Incident
            </Button>
            <RoleGate roles={["Admin"]}>
              <Button variant="outline" onClick={() => setShowEditModal(true)}>
                Edit Job
              </Button>
            </RoleGate>
          </div>
        </Card>

        <Card className="space-y-3">
          <p className="text-xs uppercase text-slate">Holder</p>
          <p className="text-lg font-semibold">{job?.current_holder_role}</p>
          <p className="text-sm text-slate">Last scan: {job?.last_scan_at ? new Date(job.last_scan_at).toLocaleString() : "-"}</p>
          <RoleGate roles={["Admin"]}>
            <div className="mt-4 space-y-2 border-t border-ink/10 pt-4">
              <p className="text-xs uppercase text-slate">Admin Override</p>
              <select
                className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm"
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value)}
              >
                <option value="">Select status</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
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
        <p className="text-sm font-semibold">Status Timeline</p>
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
                <TD>{event.from_status || "-"}</TD>
                <TD>{event.to_status}</TD>
                <TD>{event.scanned_by_role}</TD>
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
