"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  name: string;
  sku: string;
  unit: string;
}

interface Location {
  id: string;
  name: string;
}

const TYPES = [
  { value: "ISSUE",    label: "Issue",    color: "bg-red-600 text-white",     border: "border-red-500" },
  { value: "RECEIPT",  label: "Receipt",  color: "bg-emerald-600 text-white", border: "border-emerald-500" },
  { value: "WASTAGE",  label: "Wastage",  color: "bg-slate-600 text-white",   border: "border-slate-400" },
  { value: "TRANSFER", label: "Transfer", color: "bg-blue-600 text-white",    border: "border-blue-500" },
] as const;

export function QuickMovementClient({ items, locations }: { items: Item[]; locations: Location[] }) {
  const [type, setType] = useState<"ISSUE" | "RECEIPT" | "WASTAGE" | "TRANSFER">("ISSUE");
  const [itemSearch, setItemSearch] = useState("");
  const [itemId, setItemId] = useState("");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      i.sku.toLowerCase().includes(itemSearch.toLowerCase())
  ).slice(0, 8);

  const selectedItem = items.find((i) => i.id === itemId);

  const submit = async () => {
    if (!itemId || !locationId || !quantity) {
      setError("Item, location, and quantity are required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, locationId, type, quantity: Number(quantity), notes }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to record movement"); return; }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setItemId("");
        setItemSearch("");
        setQuantity("");
        setNotes("");
      }, 1800);
    } finally {
      setLoading(false);
    }
  };

  const typeConfig = TYPES.find((t) => t.value === type)!;

  return (
    <div className="space-y-5 max-w-md mx-auto">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">Movement recorded!</p>
        </div>
      )}

      {/* Movement type tabs */}
      <div className="grid grid-cols-4 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={cn(
              "rounded-xl py-3 text-sm font-semibold transition-all border-2",
              type === t.value
                ? `${t.color} ${t.border} shadow-md scale-[1.03]`
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Item search */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</label>
        {selectedItem ? (
          <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-indigo-900">{selectedItem.name}</p>
              <p className="text-xs text-indigo-500">{selectedItem.sku}</p>
            </div>
            <button
              onClick={() => { setItemId(""); setItemSearch(""); }}
              className="text-xs text-indigo-600 font-medium hover:underline"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {itemSearch && filteredItems.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setItemId(item.id); setItemSearch(""); }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-indigo-50 border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.sku}</p>
                    </div>
                    <span className="text-xs text-slate-400">{item.unit}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</label>
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 bg-white outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Quantity — large touch target */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Quantity {selectedItem && <span className="normal-case font-normal text-slate-400">({selectedItem.unit})</span>}
        </label>
        <input
          type="number"
          min={0.01}
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0"
          className="w-full rounded-xl border border-slate-200 px-4 py-4 text-2xl font-bold text-center outline-none focus:ring-2 focus:ring-indigo-300"
        />
        {/* Quick quantity buttons */}
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 5, 10, 20].map((n) => (
            <button
              key={n}
              onClick={() => setQuantity(String(n))}
              className="rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes (optional)</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. dinner service, spill, transfer to bar..."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Submit */}
      <Button
        onClick={submit}
        disabled={loading || !itemId || !quantity}
        className={cn("w-full py-6 text-base font-bold rounded-xl gap-2", typeConfig.color)}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          `Record ${typeConfig.label}`
        )}
      </Button>
    </div>
  );
}
