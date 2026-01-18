"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";

const roles = [
  "Admin",
  "Purchase",
  "Packing",
  "Dispatch",
  "Factory",
  "QC_Stock",
  "Delivery"
];

const formatRoleLabel = (role: string) => role.replace("_", " ");

function RoleToggle({
  role,
  checked,
  onChange
}: {
  role: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
        checked
          ? "border-forest/40 bg-forest/10 text-forest shadow-sm"
          : "border-ink/10 bg-white/80 text-slate-600 hover:border-ink/30 hover:text-ink"
      )}
    >
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <span>{formatRoleLabel(role)}</span>
    </label>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-slate">Security</p>
        <h2 className="mt-2 text-lg font-semibold font-display">Reset Password</h2>
        <p className="mb-4 mt-2 text-sm text-slate-600">
          Reset password for <span className="font-medium">{user.username}</span>
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500">Minimum 6 characters.</p>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-slate transition hover:border-ink/30 hover:text-ink"
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
  user: { id: string; username: string; roles: string[]; is_active: boolean };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { request } = useApi();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles ?? []);
  const [isActive, setIsActive] = useState(user.is_active);
  const [error, setError] = useState("");

  const updateMutation = useMutation({
    mutationFn: () =>
      request(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ roles: selectedRoles, is_active: isActive })
      }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: () => {
      setError("Failed to update user");
    }
  });

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const handleSubmit = () => {
    setError("");
    if (!selectedRoles.length) {
      setError("Select at least one role");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-slate">User Settings</p>
        <h2 className="mt-2 text-lg font-semibold font-display">Edit User</h2>
        <p className="mb-4 mt-2 text-sm text-slate-600">
          Editing <span className="font-medium">{user.username}</span>
        </p>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Roles</label>
              <span className="text-xs text-slate-500">{selectedRoles.length} selected</span>
            </div>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-ink/10 bg-white/90 p-3 text-sm">
              {roles.map((role) => (
                <RoleToggle
                  key={role}
                  role={role}
                  checked={selectedRoles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? "bg-forest" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm ${isActive ? "text-forest" : "text-slate-500"}`}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-slate transition hover:border-ink/30 hover:text-ink"
            onClick={onClose}
          >
            Cancel
          </button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
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
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["Purchase"]);
  const [createError, setCreateError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [resetUser, setResetUser] = useState<{ id: string; username: string } | null>(null);
  const [editUser, setEditUser] = useState<{ id: string; username: string; roles: string[]; is_active: boolean } | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => request<any[]>("/users")
  });

  const createMutation = useMutation({
    mutationFn: () =>
      request("/users", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password, roles: selectedRoles })
      }),
    onSuccess: () => {
      setUsername("");
      setPassword("");
      setSelectedRoles(["Purchase"]);
      setCreateError("");
      usersQuery.refetch();
    },
    onError: (error) => {
      setCreateError(error instanceof Error ? error.message : "Failed to add user");
    }
  });

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
    if (createError) setCreateError("");
  };

  const handleCreate = () => {
    setCreateError("");
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setCreateError("Username is required");
      return;
    }
    if (password.length < 6) {
      setCreateError("Password must be at least 6 characters");
      return;
    }
    if (!selectedRoles.length) {
      setCreateError("Select at least one role");
      return;
    }
    createMutation.mutate();
  };

  const users = usersQuery.data || [];
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const matchesName = user.username?.toLowerCase().includes(query);
      const matchesRole = (user.roles || []).some((role: string) => {
        const raw = role.toLowerCase();
        const formatted = formatRoleLabel(role).toLowerCase();
        return raw.includes(query) || formatted.includes(query);
      });
      return matchesName || matchesRole;
    });
  }, [searchQuery, users]);
  const activeCount = users.filter((user) => user.is_active).length;
  const inactiveCount = users.length - activeCount;
  const canCreate = Boolean(username.trim()) && password.length >= 6 && selectedRoles.length > 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Users</p>
          <h1 className="text-2xl font-semibold font-display">Roles & Access</h1>
          <p className="mt-2 text-sm text-slate">Control access levels, roles, and credentials.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[360px,minmax(0,1fr)]">
          <Card className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate">New User</p>
              <h2 className="mt-2 text-lg font-semibold font-display">Create Access</h2>
              <p className="mt-2 text-sm text-slate">Assign one or more roles to a teammate.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
                <Input
                  placeholder="Username"
                  autoComplete="username"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (createError) setCreateError("");
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <Input
                  placeholder="Password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (createError) setCreateError("");
                  }}
                />
                <p className="mt-1 text-xs text-slate-500">Minimum 6 characters.</p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Roles</label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      className="rounded-full border border-ink/10 px-3 py-1 font-semibold text-slate transition hover:border-ink/30 hover:text-ink"
                      onClick={() => {
                        setSelectedRoles(roles);
                        if (createError) setCreateError("");
                      }}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-ink/10 px-3 py-1 font-semibold text-slate transition hover:border-ink/30 hover:text-ink"
                      onClick={() => {
                        setSelectedRoles([]);
                        if (createError) setCreateError("");
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">Users can hold multiple roles at once.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <RoleToggle
                      key={role}
                      role={role}
                      checked={selectedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                    />
                  ))}
                </div>
              </div>
              {createError && <p className="text-sm text-red-500">{createError}</p>}
              <Button onClick={handleCreate} disabled={!canCreate || createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Adding..." : "Add User"}
              </Button>
            </div>
          </Card>
          <Card className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate">Directory</p>
                <h2 className="mt-2 text-lg font-semibold font-display">Current Team</h2>
                <p className="mt-2 text-sm text-slate">Find teammates and manage credentials.</p>
              </div>
              <Input
                className="min-w-[220px] sm:max-w-xs"
                placeholder="Search username or role"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-ink/10 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate">Total Users</p>
                <p className="mt-2 text-2xl font-semibold">{users.length}</p>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate">Active</p>
                <p className="mt-2 text-2xl font-semibold text-forest">{activeCount}</p>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate">Inactive</p>
                <p className="mt-2 text-2xl font-semibold text-slate-500">{inactiveCount}</p>
              </div>
            </div>
            <Table>
              <THead>
                <TR>
                  <TH>Username</TH>
                  <TH>Roles</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {usersQuery.isLoading && (
                  <TR>
                    <TD colSpan={5} className="py-8 text-center text-slate">
                      Loading users...
                    </TD>
                  </TR>
                )}
                {usersQuery.isError && (
                  <TR>
                    <TD colSpan={5} className="py-8 text-center text-red-500">
                      Failed to load users.
                    </TD>
                  </TR>
                )}
                {!usersQuery.isLoading && !usersQuery.isError && filteredUsers.length === 0 && (
                  <TR>
                    <TD colSpan={5} className="py-8 text-center text-slate">
                      No users found.
                    </TD>
                  </TR>
                )}
                {!usersQuery.isLoading &&
                  !usersQuery.isError &&
                  filteredUsers.map((user) => (
                    <TR key={user.id}>
                      <TD className="font-semibold text-ink">{user.username}</TD>
                      <TD>
                        <div className="flex flex-wrap gap-2">
                          {(user.roles || []).length ? (
                            (user.roles || []).map((role: string) => (
                              <Badge key={`${user.id}-${role}`} className="border-ink/10 bg-white/80 text-ink">
                                {formatRoleLabel(role)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-slate">-</span>
                          )}
                        </div>
                      </TD>
                      <TD>
                        <Badge variant={user.is_active ? "success" : "warning"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TD>
                      <TD className="text-slate">{new Date(user.created_at).toLocaleDateString()}</TD>
                      <TD>
                        <div className="flex flex-wrap gap-3">
                          <button
                            className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-ink/30"
                            onClick={() =>
                              setEditUser({
                                id: user.id,
                                username: user.username,
                                roles: user.roles || [],
                                is_active: user.is_active
                              })
                            }
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-ink/30"
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
        </div>
      </div>

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
