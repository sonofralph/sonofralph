"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, X, MapPin, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Location {
  id: string;
  name: string;
  type: string;
  departmentId?: string | null;
}

interface Department {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  locations: { id: string; name: string; type: string }[];
  _count: { locations: number };
}

interface Props {
  initialDepartments: Department[];
  allLocations: Location[];
}

export function DepartmentsClient({ initialDepartments, allLocations }: Props) {
  const router = useRouter();
  const [departments, setDepartments] = useState(initialDepartments);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedLocs, setSelectedLocs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const unassigned = allLocations.filter((l) => !l.departmentId);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function createDepartment() {
    if (!newName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      setDepartments((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setCreatingNew(false);
      setNewName("");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function renameDepartment(id: string) {
    if (!editName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to rename");
      setDepartments((prev) => prev.map((d) => (d.id === id ? data : d)).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteDepartment(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Locations will become unassigned.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openAssign(dept: Department) {
    setAssigningId(dept.id);
    setSelectedLocs(new Set(dept.locations.map((l) => l.id)));
    setError("");
  }

  async function saveAssignments(id: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationIds: Array.from(selectedLocs) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setDepartments((prev) => prev.map((d) => (d.id === id ? data : d)));
      setAssigningId(null);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Department list */}
      {departments.map((dept) => {
        const isExpanded = expanded.has(dept.id);
        const isEditing = editingId === dept.id;
        const isAssigning = assigningId === dept.id;

        return (
          <div key={dept.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => toggleExpand(dept.id)}
                className="text-slate-400 hover:text-slate-600"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {isEditing ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") renameDepartment(dept.id); if (e.key === "Escape") setEditingId(null); }}
                  />
                  <button onClick={() => renameDepartment(dept.id)} className="text-emerald-600 hover:text-emerald-700" disabled={loading}>
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 font-semibold text-slate-900">{dept.name}</span>
                  <span className="text-xs text-slate-400 mr-2">
                    {dept._count.locations} location{dept._count.locations !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => { setEditingId(dept.id); setEditName(dept.name); }}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteDepartment(dept.id, dept.name)}
                    className="text-slate-400 hover:text-red-500 p-1"
                    disabled={loading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                {isAssigning ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Select locations</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {allLocations.map((loc) => {
                        const checked = selectedLocs.has(loc.id);
                        const inOtherDept = loc.departmentId && loc.departmentId !== dept.id;
                        return (
                          <label
                            key={loc.id}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors",
                              checked ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-slate-300",
                              inOtherDept && "opacity-50"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!!inOtherDept}
                              onChange={() => {
                                setSelectedLocs((prev) => {
                                  const next = new Set(prev);
                                  next.has(loc.id) ? next.delete(loc.id) : next.add(loc.id);
                                  return next;
                                });
                              }}
                              className="accent-indigo-600"
                            />
                            <span className="truncate text-slate-700">{loc.name}</span>
                          </label>
                        );
                      })}
                    </div>
                    {allLocations.some((l) => l.departmentId && l.departmentId !== dept.id) && (
                      <p className="text-xs text-slate-400">Greyed out locations belong to another department.</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => saveAssignments(dept.id)} disabled={loading}>
                        {loading ? "Saving…" : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAssigningId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {dept.locations.length === 0 ? (
                      <p className="text-sm text-slate-400">No locations assigned yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {dept.locations.map((loc) => (
                          <span
                            key={loc.id}
                            className="flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs text-slate-600"
                          >
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {loc.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => openAssign(dept)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      {dept.locations.length === 0 ? "Assign locations" : "Edit locations"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Unassigned locations */}
      {unassigned.length > 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Unassigned locations</p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((loc) => (
              <span
                key={loc.id}
                className="flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs text-slate-500"
              >
                <MapPin className="h-3 w-3 text-slate-300" />
                {loc.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Create new */}
      {creatingNew ? (
        <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Department name…"
            className="h-8 text-sm bg-white"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") createDepartment(); if (e.key === "Escape") { setCreatingNew(false); setNewName(""); }}}
          />
          <Button size="sm" onClick={createDepartment} disabled={loading || !newName.trim()}>
            {loading ? "Creating…" : "Create"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setCreatingNew(false); setNewName(""); }}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setCreatingNew(true)}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <Plus className="h-4 w-4" />
          Add department
        </button>
      )}
    </div>
  );
}
