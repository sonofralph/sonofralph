"use client";

import { useState } from "react";
import { Plus, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

interface Handover {
  id: string;
  notes: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string; jobTitle: string | null };
  location: { id: string; name: string };
}

export function HandoverClient({
  initialHandovers,
  locations,
}: {
  initialHandovers: Handover[];
  locations: { id: string; name: string }[];
}) {
  const [handovers, setHandovers] = useState(initialHandovers);
  const [locationId, setLocationId] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!locationId) { setError("Select a location"); return; }
    if (!notes.trim()) { setError("Add handover notes"); return; }

    setLoading(true);
    const res = await fetch("/api/handovers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId, notes }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); setLoading(false); return; }
    setHandovers((prev) => [data, ...prev]);
    setNotes("");
    setLoading(false);
  }

  const filtered = filterLocation
    ? handovers.filter((h) => h.location.id === filterLocation)
    : handovers;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shift Handovers</h1>
        <p className="text-sm text-slate-500">Log notes at the end of your shift for the next team</p>
      </div>

      {/* New handover form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Log Handover Note</h2>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <div className="space-y-1.5">
          <Label>Location / Department</Label>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
            <SelectContent>
              {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Handover Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Stock issues, low items, incidents, tasks for the next shift..."
            rows={4}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Log Handover
        </Button>
      </form>

      {/* Filter + history */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Handover History</h2>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All locations</SelectItem>
              {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            No handover notes yet.
          </div>
        )}

        {filtered.map((h) => (
          <div key={h.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100">
                  <User className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {h.user.name ?? h.user.email}
                    {h.user.jobTitle && <span className="text-slate-400 font-normal"> · {h.user.jobTitle}</span>}
                  </p>
                  <p className="text-xs text-slate-400">{h.location.name} · {formatDate(new Date(h.createdAt))}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pl-9">{h.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
