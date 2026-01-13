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

function ResetPasswordModal({
  user,
  onClose,
  onSuccess
}: {
  user: { id: string; username: string };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { request } = useApi();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const resetMutation = useMutation({
    mutationFn: () =>
      request(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ password: newPassword })
      }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: () => {
      setError("Failed to reset password");
    }
  });

  const handleSubmit = () => {
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    resetMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">Reset Password</h2>
        <p className="mb-4 text-sm text-slate-600">
          Reset password for <span className="font-medium">{user.username}</span>
        </p>
        <div className="space-y-3">
          <Input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <Button onClick={handleSubmit} disabled={resetMutation.isPending}>
            {resetMutation.isPending ? "Resetting..." : "Reset Password"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditUserModal({
  user,
  onClose,
  onSuccess
}: {
  user: { id: string; username: string; role: string; is_active: boolean };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { request } = useApi();
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.is_active);
  const [error, setError] = useState("");

  const updateMutation = useMutation({
    mutationFn: () =>
      request(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role, is_active: isActive })
      }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: () => {
      setError("Failed to update user");
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">Edit User</h2>
        <p className="mb-4 text-sm text-slate-600">
          Editing <span className="font-medium">{user.username}</span>
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select
              className="w-full rounded-xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? "bg-green-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm ${isActive ? "text-green-600" : "text-slate-500"}`}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { request } = useApi();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Purchase");
  const [resetUser, setResetUser] = useState<{ id: string; username: string } | null>(null);
  const [editUser, setEditUser] = useState<{ id: string; username: string; role: string; is_active: boolean } | null>(null);

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
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {(usersQuery.data || []).map((user) => (
              <TR key={user.id}>
                <TD>{user.username}</TD>
                <TD>{user.role}</TD>
                <TD>{user.is_active ? "Active" : "Inactive"}</TD>
                <TD>{new Date(user.created_at).toLocaleDateString()}</TD>
                <TD>
                  <div className="flex gap-3">
                    <button
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => setEditUser({ id: user.id, username: user.username, role: user.role, is_active: user.is_active })}
                    >
                      Edit
                    </button>
                    <button
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => setResetUser({ id: user.id, username: user.username })}
                    >
                      Reset Password
                    </button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onSuccess={() => usersQuery.refetch()}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={() => usersQuery.refetch()}
        />
      )}
    </AppShell>
  );
}
