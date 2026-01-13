"use client";

import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useApi } from "@/lib/useApi";

const roles = [
  "Admin",
  "Purchase",
  "Packing",
  "Dispatch",
  "Factory",
  "QC_Stock",
  "Delivery"
];

export default function UsersPage() {
  const { request } = useApi();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Purchase");

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => request<any[]>("/users")
  });

  const createMutation = useMutation({
    mutationFn: () =>
      request("/users", {
        method: "POST",
        body: JSON.stringify({ username, password, role })
      }),
    onSuccess: () => {
      setUsername("");
      setPassword("");
      usersQuery.refetch();
    }
  });

  return (
    <AppShell>
      <Card className="space-y-4">
        <div>
          <p className="text-xs uppercase text-slate">Users</p>
          <h1 className="text-2xl font-semibold">Roles & Access</h1>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select
            className="rounded-xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <Button onClick={() => createMutation.mutate()}>Add User</Button>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Username</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH>Created</TH>
            </TR>
          </THead>
          <TBody>
            {(usersQuery.data || []).map((user) => (
              <TR key={user.id}>
                <TD>{user.username}</TD>
                <TD>{user.role}</TD>
                <TD>{user.is_active ? "Active" : "Inactive"}</TD>
                <TD>{new Date(user.created_at).toLocaleDateString()}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </AppShell>
  );
}
