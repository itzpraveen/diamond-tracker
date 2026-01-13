"use client";

import { useState } from "react";
import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useApi } from "@/lib/useApi";

export default function ItemsPage() {
  const { request } = useApi();
  const [query, setQuery] = useState("");

  const jobsQuery = useQuery({
    queryKey: ["jobs", query],
    queryFn: () =>
      request<any[]>(query ? `/jobs?job_id=${encodeURIComponent(query)}` : "/jobs")
  });

  const jobs = jobsQuery.data || [];

  return (
    <AppShell>
      <Card className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase text-slate">Items</p>
            <h1 className="text-2xl font-semibold">Search & Track</h1>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search by job ID"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button variant="outline" onClick={() => jobsQuery.refetch()}>
              Search
            </Button>
          </div>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Job ID</TH>
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
                  <Badge>{job.current_status}</Badge>
                </TD>
                <TD>{job.current_holder_role}</TD>
                <TD>{job.last_scan_at ? new Date(job.last_scan_at).toLocaleString() : "-"}</TD>
                <TD>
                  <Link className="text-sm text-teal" href={`/items/${job.job_id}`}>
                    View
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {!jobs.length && <p className="text-sm text-slate">No matching jobs.</p>}
      </Card>
    </AppShell>
  );
}
