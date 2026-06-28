"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Rocket, Loader2, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Location { id: string; name: string; type: string }
interface Item { id: string; name: string; sku: string; unit: string; category: string }
interface ExistingRecord { itemId: string; locationId: string; quantity: number }

interface Props {
  locations: Location[];
  items: Item[];
  existingRecords: ExistingRecord[];
  isLive: boolean;
  goLiveAt: string | null;
}

export function GoLiveClient({ locations, items, existingRecords, isLive, goLiveAt }: Props) {
  const router = useRouter();
  const [activeLocationId, setActiveLocationId] = useState(locations[0]?.id ?? "");
  const [savedLocations, setSavedLocations] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [goingLive, setGoingLive] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // qtys[locationId][itemId] = number
  const [qtys, setQtys] = useState<Record<string, Record<string, number>>>(() => {
    const init: Record<string, Record<string, number>> = {};
    for (const loc of locations) {
      init[loc.id] = {};
      for (const rec of existingRecords) {
        if (rec.locationId === loc.id) {
          init[loc.id][rec.itemId] = rec.quantity;
        }
      }
    }
    return init;
  });

  const filteredItems = useMemo(
    () =>
      items.filter(
        (i) =>
          !search ||
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.sku.toLowerCase().includes(search.toLowerCase()) ||
          i.category.toLowerCase().includes(search.toLowerCase())
      ),
    [items, search]
  );

  const setQty = (locationId: string, itemId: string, value: number) => {
    setQtys((prev) => ({
      ...prev,
      [locationId]: { ...prev[locationId], [itemId]: value },
    }));
  };

  const countFilled = (locationId: string) =>
    Object.values(qtys[locationId] ?? {}).filter((q) => q > 0).length;

  async function saveLocation(locationId: string) {
    setSaving(true);
    setError("");
    const counts = Object.entries(qtys[locationId] ?? {}).map(([itemId, quantity]) => ({
      itemId,
      quantity,
    }));
    try {
      const res = await fetch("/api/go-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, counts }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save");
        return false;
      }
      setSavedLocations((prev) => new Set([...prev, locationId]));
      return true;
    } catch {
      setError("Something went wrong. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleGoLive() {
    setGoingLive(true);
    setError("");
    const counts = Object.entries(qtys[activeLocationId] ?? {}).map(([itemId, quantity]) => ({
      itemId,
      quantity,
    }));
    try {
      const res = await fetch("/api/go-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: activeLocationId, counts, markLive: true }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGoingLive(false);
    }
  }

  const activeLocation = locations.find((l) => l.id === activeLocationId);
  const activeFilled = countFilled(activeLocationId);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
              <Rocket className="h-4.5 w-4.5 text-white h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Go Live</h1>
            {isLive && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Live since {new Date(goLiveAt!).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 ml-11.5">
            Count what&apos;s on your shelves today and enter it below. This becomes your opening stock.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
          <Package className="h-4 w-4 text-slate-400" />
          <span>{items.length} items · {locations.length} locations</span>
        </div>
      </div>

      {/* Location tabs */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Locations</p>
        <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
          {locations.map((loc) => {
            const filled = countFilled(loc.id);
            const done = savedLocations.has(loc.id);
            const isActive = activeLocationId === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => setActiveLocationId(loc.id)}
                className={cn(
                  "flex items-center gap-2 shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                )}
              >
                {done ? (
                  <CheckCircle2 className={cn("h-3.5 w-3.5", isActive ? "text-white" : "text-emerald-500")} />
                ) : (
                  <div className={cn(
                    "h-3.5 w-3.5 rounded-full border-2",
                    isActive ? "border-white" : "border-slate-300"
                  )} />
                )}
                {loc.name}
                {filled > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                  )}>
                    {filled}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Item grid */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <p className="text-sm font-semibold text-slate-900">{activeLocation?.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeFilled} of {items.length} items with stock entered
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="pl-8 h-8 text-sm w-48 bg-white"
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-[420px]">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No items match your search.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Item</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 hidden sm:table-cell">Category</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 w-16">Unit</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 w-36">Opening Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.map((item) => {
                  const qty = qtys[activeLocationId]?.[item.id] ?? 0;
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "transition-colors",
                        qty > 0 ? "bg-emerald-50/40 hover:bg-emerald-50/70" : "hover:bg-slate-50/60"
                      )}
                    >
                      <td className="px-5 py-2.5">
                        <p className="font-medium text-slate-900 leading-tight">{item.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.sku}</p>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 hidden sm:table-cell text-xs">{item.category}</td>
                      <td className="px-3 py-2.5 text-center text-xs text-slate-500">{item.unit}</td>
                      <td className="px-5 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={qty || ""}
                          onChange={(e) =>
                            setQty(activeLocationId, item.id, parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                          className={cn(
                            "w-full rounded-lg border px-3 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors",
                            qty > 0
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-medium"
                              : "border-slate-200 bg-white text-slate-700"
                          )}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {savedLocations.size > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              {savedLocations.size} of {locations.length} location{locations.length !== 1 ? "s" : ""} saved
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => saveLocation(activeLocationId)}
            disabled={saving || goingLive || activeFilled === 0}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save {activeLocation?.name}
          </Button>
          <Button
            onClick={handleGoLive}
            disabled={saving || goingLive}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {goingLive
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Rocket className="mr-2 h-4 w-4" />
            }
            {isLive ? "Update Stock" : "Go Live →"}
          </Button>
        </div>
      </div>

      {!isLive && (
        <p className="text-xs text-slate-400 text-right">
          You can skip locations and complete them later from the Stocktake page.
        </p>
      )}
    </div>
  );
}
