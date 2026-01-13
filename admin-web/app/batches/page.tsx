"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { RoleGate } from "@/lib/auth";
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

  const batchQuery = useQuery({
    queryKey: ["batch", batchId],
    queryFn: () => request<any>(`/batches/${batchId}`)
  });

  const addItemMutation = useMutation({
    mutationFn: () =>
      request(`/batches/${batchId}/items`, {
        method: "POST",
        body: JSON.stringify({ job_id: jobIdToAdd })
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

  const dispatchMutation = useMutation({
    mutationFn: () =>
      request(`/batches/${batchId}/dispatch`, {
        method: "POST",
        body: JSON.stringify({
          dispatch_date: dispatchDate ? new Date(dispatchDate).toISOString() : null,
          expected_return_date: expectedReturn ? new Date(expectedReturn).toISOString() : null
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

  const manifestUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    return `${base}/batches/${batchId}/manifest.pdf`;
  }, [batchId]);

  const canAddItems = batch?.status === "CREATED";
  const canDispatch = batch?.status === "CREATED" && batch?.item_count > 0;
  const canClose = batch?.status === "DISPATCHED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{batch?.batch_code}</h2>
            <Badge>{batch?.status}</Badge>
          </div>
          <button
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Batch Info */}
        <div className="mb-4 grid grid-cols-3 gap-4 rounded-xl border border-ink/10 bg-slate-50 p-4">
          <div>
            <p className="text-xs text-slate-500">Items</p>
            <p className="text-lg font-semibold">{batch?.item_count || 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Dispatch Date</p>
            <p className="font-medium">
              {batch?.dispatch_date ? new Date(batch.dispatch_date).toLocaleDateString() : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Expected Return</p>
            <p className="font-medium">
              {batch?.expected_return_date ? new Date(batch.expected_return_date).toLocaleDateString() : "-"}
            </p>
          </div>
        </div>

        {/* Add Item Section */}
        <RoleGate roles={["Admin", "Dispatch"]}>
          {canAddItems && (
            <div className="mb-4 rounded-xl border border-ink/10 bg-slate-50 p-4">
              <p className="mb-2 text-sm font-medium">Add Item to Batch</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Job ID (e.g., DJ-2026-000001)"
                  value={jobIdToAdd}
                  onChange={(e) => setJobIdToAdd(e.target.value)}
                />
                <Button
                  onClick={() => addItemMutation.mutate()}
                  disabled={!jobIdToAdd || addItemMutation.isPending}
                >
                  {addItemMutation.isPending ? "Adding..." : "Add"}
                </Button>
              </div>
              {addError && <p className="mt-2 text-sm text-red-500">{addError}</p>}
              <p className="mt-2 text-xs text-slate-500">Only items with status PACKED_READY can be added</p>
            </div>
          )}
        </RoleGate>

        {/* Dispatch Section */}
        <RoleGate roles={["Admin", "Dispatch"]}>
          {canDispatch && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-2 text-sm font-medium">Dispatch Batch</p>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Dispatch Date</label>
                  <Input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Expected Return</label>
                  <Input
                    type="date"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() => dispatchMutation.mutate()}
                disabled={dispatchMutation.isPending}
              >
                {dispatchMutation.isPending ? "Dispatching..." : "Dispatch Batch"}
              </Button>
              <p className="mt-2 text-xs text-slate-500">
                This will transition all items to DISPATCHED_TO_FACTORY status
              </p>
            </div>
          )}
        </RoleGate>

        {/* Close Section */}
        <RoleGate roles={["Admin", "Dispatch"]}>
          {canClose && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="mb-2 text-sm font-medium">Close Batch</p>
              <Button
                onClick={() => closeMutation.mutate()}
                disabled={closeMutation.isPending}
              >
                {closeMutation.isPending ? "Closing..." : "Close Batch"}
              </Button>
              <p className="mt-2 text-xs text-slate-500">
                All items must have returned (RECEIVED_AT_SHOP or later) to close
              </p>
            </div>
          )}
        </RoleGate>

        {/* Actions */}
        <div className="mb-4 flex gap-2">
          <a
            className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-teal"
            href={manifestUrl}
            target="_blank"
            rel="noreferrer"
          >
            Download Manifest PDF
          </a>
        </div>

        {/* Items Table */}
        <div>
          <p className="mb-2 text-sm font-medium">Items in Batch</p>
          {batch?.items?.length > 0 ? (
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
                    <TD>{item.job_id}</TD>
                    <TD>{item.customer_name || "-"}</TD>
                    <TD>
                      <Badge>{item.current_status}</Badge>
                    </TD>
                    <TD className="max-w-xs truncate">{item.item_description}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-500">No items in this batch yet.</p>
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

  return (
    <AppShell>
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase text-slate">Batches</p>
            <h1 className="text-2xl font-semibold">Monthly Dispatches</h1>
          </div>
          <RoleGate roles={["Admin", "Dispatch"]}>
            <div className="flex gap-2">
              <Input
                placeholder="Month (1-12)"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
              <Input
                placeholder="Year"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
              <Button onClick={() => createMutation.mutate()}>Create / Select</Button>
            </div>
          </RoleGate>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Batch</TH>
              <TH>Status</TH>
              <TH>Dispatch Date</TH>
              <TH>Expected Return</TH>
              <TH>Items</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {(batchesQuery.data || []).map((batch) => (
              <TR key={batch.id}>
                <TD>{batch.batch_code}</TD>
                <TD>
                  <Badge>{batch.status}</Badge>
                </TD>
                <TD>{batch.dispatch_date ? new Date(batch.dispatch_date).toLocaleDateString() : "-"}</TD>
                <TD>{batch.expected_return_date ? new Date(batch.expected_return_date).toLocaleDateString() : "-"}</TD>
                <TD>{batch.item_count}</TD>
                <TD>
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    onClick={() => setSelectedBatchId(batch.id)}
                  >
                    View Details
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {!batchesQuery.data?.length && <p className="text-sm text-slate">No batches found.</p>}
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
