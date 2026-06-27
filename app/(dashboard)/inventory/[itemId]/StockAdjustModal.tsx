"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Location {
  id: string;
  name: string;
  currentQty: number;
}

interface Props {
  itemId: string;
  itemName: string;
  unit: string;
  locations: Location[];
}

export function StockAdjustButton({ itemId, itemName, unit, locations }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="mr-1.5 h-4 w-4" />
        Adjust Stock
      </Button>
      <StockAdjustModal
        open={open}
        onClose={() => setOpen(false)}
        itemId={itemId}
        itemName={itemName}
        unit={unit}
        locations={locations}
      />
    </>
  );
}

function StockAdjustModal({ open, onClose, itemId, itemName, unit, locations }: Props & { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [adjustType, setAdjustType] = useState<"set" | "add" | "remove">("set");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentQty = locations.find((l) => l.id === locationId)?.currentQty ?? 0;

  const previewQty = (() => {
    const q = parseFloat(quantity) || 0;
    if (adjustType === "set") return q;
    if (adjustType === "add") return currentQty + q;
    return Math.max(0, currentQty - q);
  })();

  const delta = previewQty - currentQty;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locationId || !quantity) return;
    setLoading(true);
    setError("");

    const q = parseFloat(quantity);
    if (isNaN(q) || q < 0) {
      setError("Invalid quantity");
      setLoading(false);
      return;
    }

    // Map to a stock movement
    let type: string;
    let movementQty: number;

    if (adjustType === "set") {
      type = "ADJUSTMENT";
      movementQty = Math.abs(delta);
      if (movementQty === 0) { onClose(); setLoading(false); return; }
    } else if (adjustType === "add") {
      type = "RECEIPT";
      movementQty = q;
    } else {
      type = "WASTAGE";
      movementQty = q;
    }

    const res = await fetch("/api/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId,
        locationId,
        type,
        quantity: movementQty,
        notes: notes || `Stock ${adjustType === "set" ? "set to" : adjustType === "add" ? "added" : "removed"} ${q} ${unit}${notes ? ` — ${notes}` : ""}`,
      }),
    });

    if (res.ok) {
      router.refresh();
      onClose();
      setQuantity("");
      setNotes("");
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to adjust stock");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock — {itemName}</DialogTitle>
          <DialogDescription>
            Correct inventory quantity at a specific location.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-1.5">
            <Label>Location</Label>
            <select
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              required
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — current: {l.currentQty} {unit}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Adjustment type</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["set", "add", "remove"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAdjustType(t)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors capitalize ${
                    adjustType === t
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              {adjustType === "set" ? `New quantity (${unit})` : `Quantity to ${adjustType} (${unit})`}
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              required
            />
          </div>

          {quantity && (
            <div className={`rounded-lg px-4 py-3 text-sm flex items-center justify-between ${
              delta > 0 ? "bg-emerald-50 text-emerald-700" :
              delta < 0 ? "bg-red-50 text-red-700" :
              "bg-slate-50 text-slate-600"
            }`}>
              <span>New quantity</span>
              <span className="font-bold text-base">
                {previewQty} {unit}
                {delta !== 0 && (
                  <span className="ml-2 text-sm font-normal">
                    ({delta > 0 ? "+" : ""}{delta.toFixed(2)})
                  </span>
                )}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes <span className="text-slate-400 font-normal">— optional</span></Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for adjustment…"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading || !quantity || !locationId}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply Adjustment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
