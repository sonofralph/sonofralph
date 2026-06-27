"use client";

import { useState } from "react";
import { Download, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const TYPES = ["", "RECEIPT", "ISSUE", "TRANSFER", "ADJUSTMENT", "WASTAGE"];

export function MovementsExport() {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);

  const doExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (type) params.set("type", type);
      const res = await fetch(`/api/export/movements?${params}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disp = res.headers.get("Content-Disposition") ?? "";
      const match = disp.match(/filename="(.+?)"/);
      a.download = match?.[1] ?? "movements.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        <Filter className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      {open && (
        <div className="absolute right-0 top-10 z-20 w-72 rounded-xl border border-slate-200 bg-white shadow-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Export Filters</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs bg-white">
              {TYPES.map((t) => <option key={t} value={t}>{t || "All types"}</option>)}
            </select>
          </div>
          <Button size="sm" onClick={doExport} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download CSV
          </Button>
        </div>
      )}
    </div>
  );
}
