"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Line {
  id: string;
  quantity: number;
  receivedQty: number;
  unitCost: number;
  item: { id: string; name: string; sku: string; unit: string };
}

export function ReceivePOForm({ po }: { po: { id: string; status: string; lines: Line[] } }) {
  const router = useRouter();
  const [receiving, setReceiving] = useState<Record<string, number>>(() =>
    Object.fromEntries(po.lines.map((l) => [l.id, l.quantity - l.receivedQty]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReceive = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: Object.entries(receiving).map(([lineId, qty]) => ({ lineId, qty })) }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to receive"); setLoading(false); return; }
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left px-6 py-3 text-xs font-medium text-slate-500">Item</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Ordered</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Already Received</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Receiving Now</th>
            <th className="text-right px-6 py-3 text-xs font-medium text-slate-500">Unit Cost</th>
          </tr>
        </thead>
        <tbody>
          {po.lines.map((line) => {
            const remaining = line.quantity - line.receivedQty;
            const isFullyReceived = remaining <= 0;
            return (
              <tr key={line.id} className={cn("border-b border-slate-50", isFullyReceived && "bg-emerald-50/30")}>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    {isFullyReceived && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                    <div>
                      <p className="font-medium text-slate-900">{line.item.name}</p>
                      <p className="text-xs text-slate-400">{line.item.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-slate-700">{line.quantity} {line.item.unit}</td>
                <td className="px-4 py-3 text-right">
                  <span className={cn("font-medium", line.receivedQty > 0 ? "text-amber-600" : "text-slate-400")}>
                    {line.receivedQty} {line.item.unit}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {isFullyReceived ? (
                    <span className="text-xs text-emerald-600 font-medium">Complete</span>
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      max={remaining}
                      step="0.01"
                      className="w-24 text-right ml-auto"
                      value={receiving[line.id] ?? 0}
                      onChange={(e) => setReceiving((prev) => ({ ...prev, [line.id]: Number(e.target.value) }))}
                    />
                  )}
                </td>
                <td className="px-6 py-3 text-right text-slate-700">{formatCurrency(line.unitCost)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="ml-auto">
          <Button onClick={handleReceive} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : "Confirm Receipt"}
          </Button>
        </div>
      </div>
    </div>
  );
}
