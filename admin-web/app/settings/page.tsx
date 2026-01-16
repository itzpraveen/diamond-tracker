"use client";

import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { RoleGate, useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";

function EditFactoryModal({
  factory,
  onClose,
  onSuccess
}: {
  factory: { id: string; name: string; is_active: boolean };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { request } = useApi();
  const [name, setName] = useState(factory.name);
  const [isActive, setIsActive] = useState(factory.is_active);
  const [error, setError] = useState("");

  const updateMutation = useMutation({
    mutationFn: () =>
      request(`/factories/${factory.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, is_active: isActive })
      }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: () => {
      setError("Failed to update factory");
    }
  });

  const handleSubmit = () => {
    setError("");
    if (!name.trim()) {
      setError("Factory name is required");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-slate">Factory</p>
        <h2 className="mt-2 text-lg font-semibold font-display">Edit Factory</h2>
        <p className="mb-4 mt-2 text-sm text-slate-600">Update factory details and status.</p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Factory Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
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

export default function SettingsPage() {
  const { request } = useApi();
  const { roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [editFactory, setEditFactory] = useState<{ id: string; name: string; is_active: boolean } | null>(null);

  const factoriesQuery = useQuery({
    queryKey: ["factories", "all"],
    queryFn: () => request<any[]>("/factories?include_inactive=true"),
    enabled: isAdmin
  });

  const createMutation = useMutation({
    mutationFn: () =>
      request("/factories", {
        method: "POST",
        body: JSON.stringify({ name, is_active: isActive })
      }),
    onSuccess: () => {
      setName("");
      setIsActive(true);
      setError("");
      factoriesQuery.refetch();
    },
    onError: () => {
      setError("Failed to create factory");
    }
  });

  const handleCreate = () => {
    setError("");
    if (!name.trim()) {
      setError("Factory name is required");
      return;
    }
    createMutation.mutate();
  };

  return (
    <AppShell>
      <RoleGate roles={["Admin"]}>
        <Card className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate">Settings</p>
            <h1 className="text-2xl font-semibold font-display">Factory Management</h1>
            <p className="mt-2 text-sm text-slate">Add, edit, and activate factories for dispatch.</p>
          </div>

          <div className="grid gap-2 rounded-2xl border border-ink/10 bg-white/70 p-3 md:grid-cols-[2fr,1fr,1fr]">
            <Input
              placeholder="Factory name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/90 px-4 py-2 text-sm">
              <span className="text-slate-600">Active</span>
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
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Factory"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}

          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Status</TH>
                <TH>Created</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {(factoriesQuery.data || []).map((factory) => (
                <TR key={factory.id}>
                  <TD>{factory.name}</TD>
                  <TD>
                    <Badge tone={factory.is_active ? "success" : "warning"}>
                      {factory.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TD>
                  <TD>{new Date(factory.created_at).toLocaleDateString()}</TD>
                  <TD>
                    <button
                      className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:border-ink/30"
                      onClick={() => setEditFactory(factory)}
                    >
                      Edit
                    </button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          {!factoriesQuery.data?.length && <p className="text-sm text-slate">No factories found.</p>}
        </Card>
      </RoleGate>

      {editFactory && (
        <EditFactoryModal
          factory={editFactory}
          onClose={() => setEditFactory(null)}
          onSuccess={() => factoriesQuery.refetch()}
        />
      )}
    </AppShell>
  );
}
