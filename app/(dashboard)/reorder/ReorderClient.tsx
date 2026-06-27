"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ReorderItem {
  recordId: string;
  itemId: string;
  itemName: string;
  sku: string;
  unit: string;
  locationName: string;
  quantity: number;
  reorderPoint: number;
  maxStock: number;
  unitCost: number;
  suggestedQty: number;
  supplierId: string | null;
  supplierName: string | null;
}

interface Supplier {
  id: string;
  name: string;
}

export function ReorderClient({
  items,
  suppliers,
}: {
  items: ReorderItem[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(items.map((i) => i.itemId)));
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.itemId, i.suggestedQty]))
  );
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState("");

  const toggle = (itemId: string) => {
    setSelected((s) => {
      const next = new Set(s);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  const selectedItems = items.filter((i) => selected.has(i.itemId));
  const totalValue = selectedItems.reduce((s, i) => s + (quantities[i.itemId] ?? i.suggestedQty) * i.unitCost, 0);

  const createDraft = async () => {
    if (!supplierId) { setError("Please select a supplier"); return; }
    if (selectedItems.length === 0) { setError("Select at least one item"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          lines: selectedItems.map((i) => ({
            itemId: i.itemId,
            quantity: quantities[i.itemId] ?? i.suggestedQty,
            unitCost: i.unitCost,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create order"); return; }
      setCreated(data.id);
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">Draft PO created</p>
          <p className="text-sm text-slate-500 mt-1">Review and send it to your supplier</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push(`/purchase-orders/${created}`)}>
            View Purchase Order
          </Button>
          <Button variant="outline" onClick={() => { setCreated(null); router.refresh(); }}>
            Create another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Supplier selector */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900 mb-1">Supplier for this order</p>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white"
          >
            <option value="">Select supplier...</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Item list */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {items.length} item{items.length !== 1 ? "s" : ""} need restocking
          </p>
          <button
            onClick={() =>
              setSelected(
                selected.size === items.length
                  ? new Set()
                  : new Set(items.map((i) => i.itemId))
              )
            }
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            {selected.size === items.length ? "Deselect all" : "Select all"}
          </button>
        </div>

        {items.map((item, i) => (
          <div
            key={item.itemId}
            className={cn(
              "flex items-center gap-4 px-5 py-4 transition-colors",
              i !== 0 && "border-t border-slate-100",
              selected.has(item.itemId) ? "bg-white" : "bg-slate-50 opacity-60"
            )}
          >
            <input
              type="checkbox"
              checked={selected.has(item.itemId)}
              onChange={() => toggle(item.itemId)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{item.itemName}</p>
              <p className="text-xs text-slate-400">
                {item.sku} · {item.locationName} · {item.quantity} / {item.reorderPoint} {item.unit}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Qty</span>
              <input
                type="number"
                min={1}
                value={quantities[item.itemId] ?? item.suggestedQty}
                onChange={(e) =>
                  setQuantities((q) => ({ ...q, [item.itemId]: Math.max(1, Number(e.target.value)) }))
                }
                className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-center font-medium"
              />
              <span className="text-xs text-slate-400">{item.unit}</span>
            </div>
            <div className="w-24 text-right">
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency((quantities[item.itemId] ?? item.suggestedQty) * item.unitCost)}
              </p>
              <p className="text-xs text-slate-400">{formatCurrency(item.unitCost)}/{item.unit}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary + action */}
      <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-indigo-900">
            {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
          </p>
          <p className="text-xs text-indigo-600 mt-0.5">
            Estimated order value: <span className="font-bold">{formatCurrency(totalValue)}</span>
          </p>
        </div>
        <Button
          onClick={createDraft}
          disabled={loading || selectedItems.length === 0 || !supplierId}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          Create Draft PO
        </Button>
      </div>
    </div>
  );
}
