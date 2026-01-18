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
import { Card, CardDescription, CardLabel, CardTitle } from "@/components/ui/card";
import { useApi } from "@/lib/useApi";

function StatCard({
  label,
  title,
  description,
  value,
  trend
}: {
  label: string;
  title: string;
  description: string;
  value?: string | number;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-[var(--shadow-lg)]">
      <div className="absolute inset-0 bg-gradient-to-br from-forest/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <CardLabel>{label}</CardLabel>
        <CardTitle className="mt-2">{title}</CardTitle>
        {value !== undefined && (
          <p className="mt-3 text-2xl font-bold text-forest sm:text-3xl">{value}</p>
        )}
        <CardDescription className="mt-2">{description}</CardDescription>
      </div>
    </Card>
  );
}

function ChartCard({
  label,
  title,
  children,
  height = 280
}: {
  label: string;
  title: string;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <Card>
      <CardLabel>{label}</CardLabel>
      <CardTitle className="mt-2">{title}</CardTitle>
      <div className="mt-4" style={{ height }}>
        {children}
      </div>
    </Card>
  );
}

const chartColors = {
  primary: "#0f3d33",
  secondary: "#2a6b5b",
  accent: "#d4a15c",
  light: "#f0c27b",
  muted: "#5a6b63"
};

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

  const isLoading = agingQuery.isLoading || turnaroundQuery.isLoading || userActivityQuery.isLoading;

  return (
    <div className="space-y-5 animate-fadeUp sm:space-y-6">
      {/* Hero Section */}
      <Card variant="elevated" padding="lg" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,61,51,0.1),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(212,161,92,0.15),transparent_45%)]" />
        <div className="relative">
          <CardLabel>Overview</CardLabel>
          <h1 className="mt-3 text-2xl font-semibold font-display sm:text-3xl lg:text-4xl">
            Majestic Tracking Operations
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate sm:text-base">
            Maintain an immaculate chain of custody with live operational insights, expected returns, and
            scan activity across every department.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/items">
              <Button size="lg">Review Items</Button>
            </Link>
            <Link href="/batches">
              <Button variant="outline" size="lg">Manage Batches</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Pending Aging"
          title="Status Buckets"
          description="Spot bottlenecks before they become delays."
        />
        <StatCard
          label="Turnaround"
          title="Average Days"
          description="Measure time between critical stages."
        />
        <StatCard
          label="User Activity"
          title="Scans Per User"
          description="Track scan velocity and accountability."
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <ChartCard label="Pending Aging" title="Pending Aging Buckets" height={260}>
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingQuery.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,23,20,0.08)" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 11, fill: chartColors.muted }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(16,23,20,0.1)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: chartColors.muted }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(16,23,20,0.1)",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(15,23,20,0.1)"
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                <Bar dataKey="bucket_0_2" name="0-2 days" stackId="a" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="bucket_3_7" name="3-7 days" stackId="a" fill={chartColors.secondary} />
                <Bar dataKey="bucket_8_15" name="8-15 days" stackId="a" fill={chartColors.accent} />
                <Bar dataKey="bucket_16_30" name="16-30 days" stackId="a" fill={chartColors.light} />
                <Bar dataKey="bucket_30_plus" name="30+ days" stackId="a" fill={chartColors.muted} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard label="Turnaround" title="Turnaround by Stage" height={260}>
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={turnaroundQuery.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,23,20,0.08)" />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 11, fill: chartColors.muted }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(16,23,20,0.1)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: chartColors.muted }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(16,23,20,0.1)",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(15,23,20,0.1)"
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="average_days"
                  name="Avg Days"
                  stroke={chartColors.primary}
                  strokeWidth={2.5}
                  dot={{ fill: chartColors.primary, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: chartColors.accent }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* User Activity Chart */}
      <ChartCard label="User Activity" title="User Activity" height={200}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userActivityQuery.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,23,20,0.08)" />
              <XAxis
                dataKey="username"
                tick={{ fontSize: 11, fill: chartColors.muted }}
                tickLine={false}
                axisLine={{ stroke: "rgba(16,23,20,0.1)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: chartColors.muted }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(16,23,20,0.1)",
                  borderRadius: "12px",
                  boxShadow: "0 8px 24px rgba(15,23,20,0.1)"
                }}
              />
              <Bar
                dataKey="scans"
                name="Scans"
                fill={chartColors.primary}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
