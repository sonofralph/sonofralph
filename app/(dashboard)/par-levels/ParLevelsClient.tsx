"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Record {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  unit: string;
  locationName: string;
  quantity: number;
  parLevel: number;
  reorderPoint: number;
  minStock: number;
}

export function ParLevelsClient({ initialRecords }: { initialRecords: Record[] }) {
  const [records, setRecords] = useState(initialRecords);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const update = (id: string, field: "parLevel" | "reorderPoint" | "minStock", value: number) => {
    setRecords((r) => r.map((rec) => rec.id === id ? { ...rec, [field]: value } : rec));
    setDirty((d) => new Set(d).add(id));
    setSaved(false);
  };

  const save = async () => {
    const toSave = records.filter((r) => dirty.has(r.id));
    if (toSave.length === 0) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/par-levels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: toSave.map((r) => ({
            recordId: r.id,
            parLevel: r.parLevel,
            reorderPoint: r.reorderPoint,
            minStock: r.minStock,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Save failed"); return; }
      setDirty(new Set());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const belowPar = records.filter((r) => r.quantity < r.parLevel);
  const atPar = records.filter((r) => r.quantity >= r.parLevel);

  return (
    <div className="space-y-5">
      {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-slate-900">{records.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Records configured</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-2xl font-bold text-amber-600">{belowPar.length}</p>
          <p className="text-xs text-amber-700 mt-0.5">Below par level</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-2xl font-bold text-emerald-600">{atPar.length}</p>
          <p className="text-xs text-emerald-700 mt-0.5">At or above par</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Item · Location</span>
          <span className="w-20 text-right">Current</span>
          <span className="w-24 text-center">Min Stock</span>
          <span className="w-24 text-center">Reorder At</span>
          <span className="w-24 text-center">Par Level</span>
          <span className="w-16 text-center">Fill %</span>
        </div>

        {records.map((rec, i) => {
          const fillPct = rec.parLevel > 0 ? Math.min(100, Math.round((rec.quantity / rec.parLevel) * 100)) : 100;
          const isDirty = dirty.has(rec.id);
          return (
            <div key={rec.id} className={cn(
              "grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-3 px-5 py-3.5",
              i !== 0 && "border-t border-slate-100",
              isDirty && "bg-indigo-50/40"
            )}>
              <div>
                <p className="text-sm font-medium text-slate-900">{rec.itemName}
                  {isDirty && <span className="ml-1.5 text-[10px] text-indigo-500 font-semibold">unsaved</span>}
                </p>
                <p className="text-xs text-slate-400">{rec.sku} · {rec.locationName}</p>
              </div>
              <div className="w-20 text-right">
                <span className="text-sm font-semibold text-slate-900">{rec.quantity}</span>
                <span className="text-xs text-slate-400 ml-1">{rec.unit}</span>
              </div>
              <div className="w-24">
                <input type="number" min={0} step="any" value={rec.minStock}
                  onChange={(e) => update(rec.id, "minStock", Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-indigo-300 outline-none" />
              </div>
              <div className="w-24">
                <input type="number" min={0} step="any" value={rec.reorderPoint}
                  onChange={(e) => update(rec.id, "reorderPoint", Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-indigo-300 outline-none" />
              </div>
              <div className="w-24">
                <input type="number" min={0} step="any" value={rec.parLevel}
                  onChange={(e) => update(rec.id, "parLevel", Number(e.target.value))}
                  className={cn(
                    "w-full rounded-lg border px-2 py-1.5 text-sm text-center font-semibold focus:ring-2 focus:ring-indigo-300 outline-none",
                    rec.quantity < rec.parLevel ? "border-amber-300 bg-amber-50" : "border-slate-200"
                  )} />
              </div>
              <div className="w-16 text-center">
                <div className="text-xs font-bold text-slate-700">{fillPct}%</div>
                <div className="h-1.5 rounded-full bg-slate-100 mt-1">
                  <div className={cn("h-1.5 rounded-full transition-all", fillPct >= 100 ? "bg-emerald-500" : fillPct >= 50 ? "bg-amber-400" : "bg-red-400")}
                    style={{ width: `${fillPct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{dirty.size} unsaved change{dirty.size !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-3">
          {saved && <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium"><CheckCircle2 className="h-4 w-4" />Saved</span>}
          <Button onClick={save} disabled={saving || dirty.size === 0} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            Save Par Levels
          </Button>
        </div>
      </div>
    </div>
  );
}
