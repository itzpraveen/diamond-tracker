"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApi } from "@/lib/useApi";

export default function Dashboard() {
  const { request } = useApi();

  const agingQuery = useQuery({
    queryKey: ["reports", "aging"],
    queryFn: () => request<any[]>("/reports/pending-aging")
  });

  const turnaroundQuery = useQuery({
    queryKey: ["reports", "turnaround"],
    queryFn: () => request<any[]>("/reports/turnaround")
  });

  const userActivityQuery = useQuery({
    queryKey: ["reports", "user-activity"],
    queryFn: () => request<any[]>("/reports/user-activity")
  });

  return (
    <div className="space-y-6 animate-fadeUp">
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,61,51,0.12),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(212,161,92,0.2),transparent_50%)]" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Overview</p>
          <h1 className="mt-3 text-3xl font-semibold font-display">Majestic Tracking Operations</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate">
            Maintain an immaculate chain of custody with live operational insights, expected returns, and
            scan activity across every department.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="inline-flex" href="/items">
              <Button>Review Items</Button>
            </Link>
            <Link className="inline-flex" href="/batches">
              <Button variant="outline">Manage Batches</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-ink/10 bg-white/85">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Pending Aging</p>
          <h2 className="mt-3 text-2xl font-semibold font-display">Status Buckets</h2>
          <p className="mt-2 text-sm text-slate">Spot bottlenecks before they become delays.</p>
        </Card>
        <Card className="border border-ink/10 bg-white/85">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Turnaround</p>
          <h2 className="mt-3 text-2xl font-semibold font-display">Average Days</h2>
          <p className="mt-2 text-sm text-slate">Measure time between critical stages.</p>
        </Card>
        <Card className="border border-ink/10 bg-white/85">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">User Activity</p>
          <h2 className="mt-3 text-2xl font-semibold font-display">Scans Per User</h2>
          <p className="mt-2 text-sm text-slate">Track scan velocity and accountability.</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-[360px]">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Pending Aging</p>
          <p className="mt-2 text-lg font-semibold font-display">Pending Aging Buckets</p>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingQuery.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bucket_0_2" stackId="a" fill="#0f3d33" />
                <Bar dataKey="bucket_3_7" stackId="a" fill="#2a6b5b" />
                <Bar dataKey="bucket_8_15" stackId="a" fill="#d4a15c" />
                <Bar dataKey="bucket_16_30" stackId="a" fill="#f0c27b" />
                <Bar dataKey="bucket_30_plus" stackId="a" fill="#39433f" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="h-[360px]">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Turnaround</p>
          <p className="mt-2 text-lg font-semibold font-display">Turnaround by Stage</p>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={turnaroundQuery.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="average_days" stroke="#0f3d33" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <p className="text-xs uppercase tracking-[0.3em] text-slate">User Activity</p>
        <p className="mt-2 text-lg font-semibold font-display">User Activity</p>
        <div className="mt-4 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userActivityQuery.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="username" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="scans" fill="#0f3d33" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
