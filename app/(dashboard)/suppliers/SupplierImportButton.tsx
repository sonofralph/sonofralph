"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle2, AlertCircle, FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ParsedRow {
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  _error?: string;
}

const SAMPLE_CSV = `name,contact,email,phone,address
Metro Food Distributors,Robert Kim,orders@metro.com,+254 700 000 001,Industrial Area Nairobi
Fresh Produce Ltd,Jane Otieno,produce@fresh.co.ke,+254 700 000 002,Wakulima Market
Beverage House,Michael Mwangi,bev@house.co.ke,+254 700 000 003,Westlands Nairobi
`;

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  return lines
    .slice(1)
    .map((line) => {
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

      return {
        name: row.name ?? "",
        contact: row.contact ?? "",
        email: row.email ?? "",
        phone: row.phone ?? "",
        address: row.address ?? "",
        _error: !row.name?.trim() ? "Missing: name" : undefined,
      };
    })
    .filter((r) => r.name || r._error);
}

export function SupplierImportButton() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const validRows = rows.filter((r) => !r._error);
  const invalidRows = rows.filter((r) => r._error);

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) { setError("Please upload a .csv file"); return; }
    setFileName(file.name);
    setError("");
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setRows(parseCSV(e.target?.result as string));
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
      const res = await fetch("/api/suppliers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      });
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
    setOpen(false);
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mise-suppliers-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Import CSV
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Suppliers</DialogTitle>
            <DialogDescription>
              Upload a CSV with your supplier list. Duplicates (same name) are skipped.
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
                  {result.created} supplier{result.created !== 1 ? "s" : ""} added
                  {result.skipped > 0 && `, ${result.skipped} skipped (already exist)`}
                </p>
              </div>
              <Button onClick={handleClose}>Done</Button>
            </div>
          ) : (
            <div className="space-y-4">
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
                    <p className="text-xs text-slate-400 mt-1">Columns: name (required), contact, email, phone, address</p>
                  </div>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </div>
              )}

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
                      <span>{invalidRows.length} row{invalidRows.length !== 1 ? "s" : ""} skipped — missing required name field.</span>
                    </div>
                  )}

                  <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          {["Name", "Contact", "Email", "Phone"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-medium text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((row, i) => (
                          <tr key={i} className={cn(row._error ? "bg-red-50" : "bg-white")}>
                            <td className="px-3 py-2 font-medium text-slate-900">{row.name || <span className="text-red-400">—</span>}</td>
                            <td className="px-3 py-2 text-slate-500">{row.contact || "—"}</td>
                            <td className="px-3 py-2 text-slate-500">{row.email || "—"}</td>
                            <td className="px-3 py-2 text-slate-500">{row.phone || "—"}</td>
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
                  <Button onClick={handleImport} disabled={validRows.length === 0 || loading}>
                    {loading
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing…</>
                      : `Import ${validRows.length} supplier${validRows.length !== 1 ? "s" : ""}`
                    }
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
