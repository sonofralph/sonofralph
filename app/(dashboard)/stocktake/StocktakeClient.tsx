"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StockRecord {
  recordId: string;
  itemId: string;
  name: string;
  sku: string;
  unit: string;
  currentQty: number;
}

interface Location {
  id: string;
  name: string;
}

export function StocktakeClient({
  locations,
  recordsByLocation,
}: {
  locations: Location[];
  recordsByLocation: Record<string, StockRecord[]>;
}) {
  const router = useRouter();
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ adjustments: number } | null>(null);

  const records = recordsByLocation[locationId] ?? [];

  // Reset counts when location changes
  const handleLocationChange = (id: string) => {
    setLocationId(id);
    setCounts({});
    setError("");
    setResult(null);
  };

  const summary = useMemo(() => {
    let variances = 0;
    let overages = 0;
    let shortages = 0;
    for (const r of records) {
      const entered = counts[r.itemId];
      if (entered === undefined || entered === "") continue;
      const diff = Number(entered) - r.currentQty;
      if (diff !== 0) variances++;
      if (diff > 0) overages++;
      if (diff < 0) shortages++;
    }
    return { variances, overages, shortages, entered: Object.values(counts).filter((v) => v !== "").length };
  }, [counts, records]);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const payload = records
        .filter((r) => counts[r.itemId] !== undefined && counts[r.itemId] !== "")
        .map((r) => ({
          itemId: r.itemId,
          recordId: r.recordId,
          physicalQty: Number(counts[r.itemId]),
          currentQty: r.currentQty,
        }));

      if (payload.length === 0) {
        setError("Enter at least one count before submitting");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/stocktake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, counts: payload, notes }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit stocktake"); return; }
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">Stocktake complete</p>
          <p className="text-sm text-slate-500 mt-1">
            {result.adjustments === 0
              ? "No discrepancies — inventory matches your counts."
              : `${result.adjustments} adjustment${result.adjustments !== 1 ? "s" : ""} applied to inventory.`}
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push("/movements")}>View Adjustments</Button>
          <Button variant="outline" onClick={() => { setResult(null); setCounts({}); }}>
            Count another location
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

      {/* Location picker */}
      <div className="flex flex-wrap gap-2">
        {locations.map((loc) => (
          <button
            key={loc.id}
            onClick={() => handleLocationChange(loc.id)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              locationId === loc.id
                ? "border-indigo-500 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {loc.name}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      {records.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex-1 h-1.5 rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${(summary.entered / records.length) * 100}%` }}
            />
          </div>
          <span>{summary.entered} / {records.length} counted</span>
        </div>
      )}

      {/* Count table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Item</span>
          <span className="text-right">System Qty</span>
          <span className="text-right">Physical Count</span>
          <span className="text-right w-16">Variance</span>
        </div>

        {records.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No items in this location</div>
        ) : (
          records.map((record, i) => {
            const entered = counts[record.itemId];
            const hasCount = entered !== undefined && entered !== "";
            const physical = hasCount ? Number(entered) : null;
            const diff = physical !== null ? physical - record.currentQty : null;

            return (
              <div
                key={record.itemId}
                className={cn(
                  "grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3.5",
                  i !== 0 && "border-t border-slate-100",
                  hasCount && diff !== 0 ? "bg-amber-50/40" : "bg-white"
                )}
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{record.name}</p>
                  <p className="text-xs text-slate-400">{record.sku}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-slate-500">{record.currentQty}</span>
                  <span className="text-xs text-slate-400 ml-1">{record.unit}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="—"
                    value={entered ?? ""}
                    onChange={(e) => setCounts((c) => ({ ...c, [record.itemId]: e.target.value }))}
                    className={cn(
                      "w-24 rounded-lg border px-2.5 py-1.5 text-sm text-right font-medium outline-none focus:ring-2 focus:ring-indigo-300",
                      hasCount && diff !== 0
                        ? "border-amber-300 bg-amber-50"
                        : "border-slate-200 bg-white"
                    )}
                  />
                  <span className="text-xs text-slate-400">{record.unit}</span>
                </div>
                <div className="w-16 text-right">
                  {diff === null ? (
                    <Minus className="h-3.5 w-3.5 text-slate-300 ml-auto" />
                  ) : diff > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                      <TrendingUp className="h-3 w-3" />+{diff}
                    </span>
                  ) : diff < 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-600">
                      <TrendingDown className="h-3 w-3" />{diff}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">✓</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary + notes + submit */}
      {summary.variances > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-amber-800">
            <span className="font-semibold">{summary.variances} variance{summary.variances !== 1 ? "s" : ""}</span>
            {" "}detected — {summary.shortages} shortage{summary.shortages !== 1 ? "s" : ""}, {summary.overages} overage{summary.overages !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-500">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. End of week count, checked by..."
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 resize-none outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {summary.entered} item{summary.entered !== 1 ? "s" : ""} counted ·{" "}
          {summary.variances} variance{summary.variances !== 1 ? "s" : ""}
        </p>
        <Button onClick={submit} disabled={loading || summary.entered === 0} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Submit Stocktake
        </Button>
      </div>
    </div>
  );
}
