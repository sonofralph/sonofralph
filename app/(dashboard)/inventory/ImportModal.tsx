"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle2, AlertCircle, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { UpgradeModal } from "@/components/ui/UpgradeModal";

interface ParsedRow {
  name: string;
  sku: string;
  unit: string;
  category: string;
  unitCost: number;
  description?: string;
  _error?: string;
}

const REQUIRED = ["name", "sku", "unit", "category"] as const;

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  return lines.slice(1).map((line) => {
    // Handle quoted fields with commas
    const values: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { values.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    values.push(cur.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });

    const missing = REQUIRED.filter((f) => !row[f]);
    return {
      name: row.name ?? "",
      sku: row.sku ?? "",
      unit: row.unit ?? "",
      category: row.category ?? "",
      unitCost: parseFloat(row.unitcost ?? row["unit cost"] ?? "0") || 0,
      description: row.description || undefined,
      _error: missing.length ? `Missing: ${missing.join(", ")}` : undefined,
    };
  }).filter((r) => r.name || r.sku);
}

const SAMPLE_CSV = `name,sku,unit,category,unitCost,description
Chicken Breast,CHK-001,kg,Meat & Poultry,8.50,Fresh chicken breast
Olive Oil,OIL-001,litre,Dry Goods,12.00,Extra virgin
Basmati Rice,RIC-001,kg,Dry Goods,3.20,
Red Wine,WIN-001,bottle,Beverages,15.00,House red
`;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ImportModal({ open, onClose }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{ current: number; limit: number; currentPlan: string } | null>(null);

  const validRows = rows.filter((r) => !r._error);
  const invalidRows = rows.filter((r) => r._error);

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a .csv file");
      return;
    }
    setFileName(file.name);
    setError("");
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target?.result as string);
      setRows(parsed);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      });
      if (res.status === 402) {
        const data = await res.json();
        onClose();
        setUpgradeInfo({ current: data.current, limit: data.limit, currentPlan: data.currentPlan ?? "FREE" });
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult(data);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setRows([]);
    setFileName("");
    setResult(null);
    setError("");
    onClose();
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mise-items-import-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
    <UpgradeModal
      open={!!upgradeInfo}
      onClose={() => setUpgradeInfo(null)}
      resource="items"
      current={upgradeInfo?.current ?? 0}
      limit={upgradeInfo?.limit ?? 50}
      currentPlan={upgradeInfo?.currentPlan}
    />
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Inventory Items</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk-import items. New categories are created automatically.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">Import complete</p>
              <p className="text-sm text-slate-500 mt-1">
                {result.created} item{result.created !== 1 ? "s" : ""} created
                {result.updated > 0 && `, ${result.updated} updated`}
              </p>
            </div>
            <Button onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Drop zone */}
            {rows.length === 0 && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors",
                  dragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                  <Upload className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">Drop your CSV here or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">Columns: name, sku, unit, category, unitCost, description</p>
                </div>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
            )}

            {/* File loaded — preview */}
            {rows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{fileName}</span>
                    <span className="text-slate-400">· {rows.length} rows</span>
                  </div>
                  <button onClick={() => { setRows([]); setFileName(""); }} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {invalidRows.length > 0 && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{invalidRows.length} row{invalidRows.length !== 1 ? "s" : ""} skipped due to missing required fields.</span>
                  </div>
                )}

                <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        {["Name", "SKU", "Unit", "Category", "Cost"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, i) => (
                        <tr key={i} className={cn(row._error ? "bg-red-50" : "bg-white")}>
                          <td className="px-3 py-2 font-medium text-slate-900">{row.name || <span className="text-red-400">—</span>}</td>
                          <td className="px-3 py-2 text-slate-500">{row.sku || <span className="text-red-400">—</span>}</td>
                          <td className="px-3 py-2 text-slate-500">{row.unit}</td>
                          <td className="px-3 py-2 text-slate-500">{row.category}</td>
                          <td className="px-3 py-2 text-slate-500">{row.unitCost > 0 ? `$${row.unitCost.toFixed(2)}` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <button onClick={downloadSample} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline">
                <Download className="h-3.5 w-3.5" />
                Download sample CSV
              </button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button
                  onClick={handleImport}
                  disabled={validRows.length === 0 || loading}
                >
                  {loading ? "Importing…" : `Import ${validRows.length} item${validRows.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
