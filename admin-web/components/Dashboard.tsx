"use client";

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase text-slate">Pending Aging</p>
          <h2 className="mt-2 text-2xl font-semibold">Status Buckets</h2>
          <p className="mt-2 text-sm text-slate">See items waiting too long by status.</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-slate">Turnaround</p>
          <h2 className="mt-2 text-2xl font-semibold">Average Days</h2>
          <p className="mt-2 text-sm text-slate">Measure time between critical stages.</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-slate">User Activity</p>
          <h2 className="mt-2 text-2xl font-semibold">Scans Per User</h2>
          <p className="mt-2 text-sm text-slate">Operational scan volume.</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-[360px]">
          <p className="text-sm font-semibold">Pending Aging Buckets</p>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingQuery.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bucket_0_2" stackId="a" fill="#0f766e" />
                <Bar dataKey="bucket_3_7" stackId="a" fill="#14b8a6" />
                <Bar dataKey="bucket_8_15" stackId="a" fill="#d97706" />
                <Bar dataKey="bucket_16_30" stackId="a" fill="#f59e0b" />
                <Bar dataKey="bucket_30_plus" stackId="a" fill="#334155" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="h-[360px]">
          <p className="text-sm font-semibold">Turnaround by Stage</p>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={turnaroundQuery.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="average_days" stroke="#0f766e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <p className="text-sm font-semibold">User Activity</p>
        <div className="mt-4 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userActivityQuery.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="username" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="scans" fill="#111113" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
