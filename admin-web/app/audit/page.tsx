"use client";

import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useApi } from "@/lib/useApi";
import { useQuery } from "@tanstack/react-query";

export default function AuditPage() {
  const { request } = useApi();
  const auditQuery = useQuery({
    queryKey: ["audit"],
    queryFn: () => request<any[]>("/audit/events")
  });

  return (
    <AppShell>
      <Card>
        <div className="mb-4">
          <p className="text-xs uppercase text-slate">Audit Log</p>
          <h1 className="text-2xl font-semibold">Immutable Status Events</h1>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Job</TH>
              <TH>From</TH>
              <TH>To</TH>
              <TH>By</TH>
              <TH>At</TH>
              <TH>Override</TH>
            </TR>
          </THead>
          <TBody>
            {(auditQuery.data || []).map((event) => (
              <TR key={event.id}>
                <TD>{event.job_id}</TD>
                <TD>{event.from_status || "-"}</TD>
                <TD>{event.to_status}</TD>
                <TD>{event.scanned_by_role}</TD>
                <TD>{new Date(event.timestamp).toLocaleString()}</TD>
                <TD>
                  {event.override_reason ? (
                    <Badge tone="warning">{event.override_reason}</Badge>
                  ) : (
                    "-"
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </AppShell>
  );
}
