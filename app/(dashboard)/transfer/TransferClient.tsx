"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Item { id: string; name: string; sku: string; unit: string }
interface Location { id: string; name: string }
interface StockRecord { itemId: string; locationId: string; quantity: number }

export function TransferClient({
  items, locations, stockRecords,
}: {
  items: Item[];
  locations: Location[];
  stockRecords: StockRecord[];
}) {
  const [itemSearch, setItemSearch] = useState("");
  const [itemId, setItemId] = useState("");
  const [fromId, setFromId] = useState(locations[0]?.id ?? "");
  const [toId, setToId] = useState(locations[1]?.id ?? locations[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const filteredItems = items
    .filter((i) =>
      i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      i.sku.toLowerCase().includes(itemSearch.toLowerCase())
    ).slice(0, 8);

  const selectedItem = items.find((i) => i.id === itemId);
  const fromLocation = locations.find((l) => l.id === fromId);
  const toLocation = locations.find((l) => l.id === toId);

  const currentStock = stockRecords.find(
    (r) => r.itemId === itemId && r.locationId === fromId
  )?.quantity ?? 0;

  const submit = async () => {
    if (!itemId || !fromId || !toId || !quantity) {
      setError("All fields are required");
      return;
    }
    if (fromId === toId) {
      setError("Source and destination must be different locations");
      return;
    }
    const qty = Number(quantity);
    if (qty > currentStock) {
      setError(`Only ${currentStock} ${selectedItem?.unit} available at ${fromLocation?.name}`);
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Two movements: ISSUE from source, RECEIPT at destination
      const [res1] = await Promise.all([
        fetch("/api/movements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId, locationId: fromId, type: "TRANSFER",
            quantity: qty,
            reference: `TRANSFER→${toLocation?.name}`,
            notes: notes || `Transfer to ${toLocation?.name}`,
          }),
        }),
      ]);
      if (!res1.ok) {
        const d = await res1.json();
        setError(d.error ?? "Transfer failed");
        return;
      }
      // Receipt at destination
      await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId, locationId: toId, type: "RECEIPT",
          quantity: qty,
          reference: `TRANSFER←${fromLocation?.name}`,
          notes: notes || `Transfer from ${fromLocation?.name}`,
        }),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setItemId(""); setItemSearch(""); setQuantity(""); setNotes("");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-lg">
      {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">Transfer complete!</p>
        </div>
      )}

      {/* Item */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</label>
        {selectedItem ? (
          <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-indigo-900">{selectedItem.name}</p>
              <p className="text-xs text-indigo-500">{selectedItem.sku} · {currentStock} {selectedItem.unit} at {fromLocation?.name}</p>
            </div>
            <button onClick={() => { setItemId(""); setItemSearch(""); }} className="text-xs text-indigo-600 font-medium hover:underline">Change</button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Search item..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {itemSearch && filteredItems.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                {filteredItems.map((item) => (
                  <button key={item.id} onClick={() => { setItemId(item.id); setItemSearch(""); }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-indigo-50 border-b border-slate-50 last:border-0">
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

      {/* From → To */}
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">From</label>
          <select value={fromId} onChange={(e) => setFromId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-300">
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-400 mt-5 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">To</label>
          <select value={toId} onChange={(e) => setToId(e.target.value)}
            className={cn("w-full rounded-xl border px-3 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-300", fromId === toId ? "border-red-300" : "border-slate-200")}>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Quantity {selectedItem && <span className="normal-case font-normal text-slate-400">({selectedItem.unit} · {currentStock} available)</span>}
        </label>
        <input type="number" min={0.01} step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)}
          placeholder="0"
          className="w-full rounded-xl border border-slate-200 px-4 py-4 text-2xl font-bold text-center outline-none focus:ring-2 focus:ring-indigo-300" />
        {currentStock > 0 && (
          <div className="grid grid-cols-4 gap-1.5">
            {[Math.ceil(currentStock * 0.25), Math.ceil(currentStock * 0.5), Math.ceil(currentStock * 0.75), currentStock].map((n, i) => (
              <button key={i} onClick={() => setQuantity(String(n))}
                className="rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                {["25%", "50%", "75%", "All"][i]}<br /><span className="font-normal text-slate-400">{n}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes (optional)</label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for transfer..."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>

      <Button onClick={submit} disabled={loading || !itemId || !quantity || fromId === toId} className="w-full py-6 text-base font-bold rounded-xl gap-2 bg-blue-600 hover:bg-blue-700">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
        Transfer Stock
      </Button>
    </div>
  );
}
