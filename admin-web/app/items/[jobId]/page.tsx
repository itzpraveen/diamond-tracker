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

export default function ItemDetailPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params?.jobId as string;
  const { request } = useApi();
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

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
    onSuccess: () => jobQuery.refetch()
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
          <p className="text-sm text-slate">{job?.item_description}</p>
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
          <div className="flex gap-2">
            <a
              className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-teal"
              href={labelUrl}
              target="_blank"
              rel="noreferrer"
            >
              Download Label
            </a>
            <Button variant="outline">Create Incident</Button>
          </div>
        </Card>

        <Card className="space-y-3">
          <p className="text-xs uppercase text-slate">Holder</p>
          <p className="text-lg font-semibold">{job?.current_holder_role}</p>
          <p className="text-sm text-slate">Last scan: {job?.last_scan_at ? new Date(job.last_scan_at).toLocaleString() : "-"}</p>
          <RoleGate roles={["Admin"]}>
            <div className="mt-4 space-y-2">
              <p className="text-xs uppercase text-slate">Admin Override</p>
              <Input
                placeholder="Target status (e.g. ON_HOLD)"
                value={overrideStatus}
                onChange={(event) => setOverrideStatus(event.target.value)}
              />
              <Input
                placeholder="Reason"
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
              />
              <Button
                onClick={() => overrideMutation.mutate()}
                disabled={!overrideStatus || !overrideReason}
              >
                Apply Override
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
    </AppShell>
  );
}
