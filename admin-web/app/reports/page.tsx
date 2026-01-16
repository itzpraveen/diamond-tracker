"use client";

import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getApiBaseUrl } from "@/lib/apiBase";
import { useApi } from "@/lib/useApi";
import { useQuery } from "@tanstack/react-query";

export default function ReportsPage() {
  const { request } = useApi();
  const delaysQuery = useQuery({
    queryKey: ["reports", "batch-delays"],
    queryFn: () => request<any[]>("/reports/batch-delays")
  });

  const exportCsv = (type: string) => {
    const base = getApiBaseUrl();
    window.open(`${base}/reports/export.csv?type=${type}`, "_blank");
  };

  return (
    <AppShell>
      <Card className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate">Reports</p>
            <h1 className="text-2xl font-semibold font-display">Exports & Delays</h1>
            <p className="mt-2 text-sm text-slate">Generate CSV exports or review delayed batches.</p>
          </div>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-ink/10 bg-white/70 p-2">
            <Button variant="outline" onClick={() => exportCsv("jobs")}>Export Jobs</Button>
            <Button variant="outline" onClick={() => exportCsv("batches")}>Export Batches</Button>
            <Button variant="outline" onClick={() => exportCsv("incidents")}>Export Incidents</Button>
          </div>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Batch</TH>
              <TH>Expected Return</TH>
              <TH>Dispatch</TH>
              <TH>Delay (days)</TH>
            </TR>
          </THead>
          <TBody>
            {(delaysQuery.data || []).map((batch) => (
              <TR key={batch.batch_code}>
                <TD>{batch.batch_code}</TD>
                <TD>{batch.expected_return_date ? new Date(batch.expected_return_date).toLocaleDateString() : "-"}</TD>
                <TD>{batch.dispatch_date ? new Date(batch.dispatch_date).toLocaleDateString() : "-"}</TD>
                <TD>{batch.delay_days}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </AppShell>
  );
}
