"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { RoleGate } from "@/lib/auth";
import { useApi } from "@/lib/useApi";

export default function IncidentsPage() {
  const { request } = useApi();

  const incidentsQuery = useQuery({
    queryKey: ["incidents"],
    queryFn: () => request<any[]>("/incidents")
  });

  const resolveMutation = useMutation({
    mutationFn: (incidentId: string) =>
      request(`/incidents/${incidentId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolution_notes: "Resolved via admin panel" })
      }),
    onSuccess: () => incidentsQuery.refetch()
  });

  return (
    <AppShell>
      <Card>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Incidents</p>
          <h1 className="text-2xl font-semibold font-display">Exceptions & Resolutions</h1>
          <p className="mt-2 text-sm text-slate">Investigate discrepancies and close the loop on issues.</p>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>ID</TH>
              <TH>Type</TH>
              <TH>Status</TH>
              <TH>Description</TH>
              <TH>Action</TH>
            </TR>
          </THead>
          <TBody>
            {(incidentsQuery.data || []).map((incident) => (
              <TR key={incident.id}>
                <TD>{incident.id.slice(0, 8)}</TD>
                <TD>{incident.type}</TD>
                <TD>
                  <Badge variant={incident.status === "RESOLVED" ? "success" : "warning"}>{incident.status}</Badge>
                </TD>
                <TD className="max-w-xs truncate">{incident.description}</TD>
                <TD>
                  <RoleGate roles={["Admin", "QC_Stock"]}>
                    {incident.status !== "RESOLVED" && (
                      <Button variant="outline" onClick={() => resolveMutation.mutate(incident.id)}>
                        Resolve
                      </Button>
                    )}
                  </RoleGate>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </AppShell>
  );
}
