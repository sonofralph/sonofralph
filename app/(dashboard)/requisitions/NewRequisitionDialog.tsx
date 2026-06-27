"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Line { itemId: string; quantity: string; notes: string }

export function NewRequisitionDialog({
  locations,
  items,
  onCreated,
  onClose,
}: {
  locations: { id: string; name: string }[];
  items: { id: string; name: string; unit: string }[];
  onCreated: (r: any) => void;
  onClose: () => void;
}) {
  const [locationId, setLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ itemId: "", quantity: "", notes: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addLine() { setLines((l) => [...l, { itemId: "", quantity: "", notes: "" }]); }
  function removeLine(i: number) { setLines((l) => l.filter((_, j) => j !== i)); }
  function updateLine(i: number, field: keyof Line, value: string) {
    setLines((l) => l.map((line, j) => j === i ? { ...line, [field]: value } : line));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!locationId) { setError("Select a location"); return; }
    const validLines = lines.filter((l) => l.itemId && parseFloat(l.quantity) > 0);
    if (validLines.length === 0) { setError("Add at least one item with a quantity"); return; }

    setLoading(true);
    const res = await fetch("/api/requisitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locationId,
        notes: notes || undefined,
        lines: validLines.map((l) => ({
          itemId: l.itemId,
          quantity: parseFloat(l.quantity),
          notes: l.notes || undefined,
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to submit"); setLoading(false); return; }
    onCreated(data);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Stock Requisition</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="space-y-1.5">
            <Label>Location</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
              <SelectContent>
                {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Items Requested</Label>
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_auto] gap-2 items-start">
                <Select value={line.itemId} onValueChange={(v) => updateLine(i, "itemId", v)}>
                  <SelectTrigger><SelectValue placeholder="Item" /></SelectTrigger>
                  <SelectContent>
                    {items.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} ({item.unit})</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Qty"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, "quantity", e.target.value)}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(i)} disabled={lines.length === 1}>
                  <Trash2 className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="mr-1 h-3 w-3" /> Add item
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any context for the manager..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
