"use client";

import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { RoleGate } from "@/lib/auth";
import { useApi } from "@/lib/useApi";

export default function BatchesPage() {
  const { request } = useApi();
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

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
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </AppShell>
  );
}
