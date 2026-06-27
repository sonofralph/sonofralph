"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Supplier {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  alertId: string;
  itemId: string;
  itemName: string;
  itemUnit: string;
  unitCost: number;
  suppliers: Supplier[];
}

export function CreatePOModal({
  open,
  onClose,
  alertId,
  itemId,
  itemName,
  itemUnit,
  unitCost,
  suppliers,
}: Props) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const qty = parseFloat(quantity) || 0;
  const total = qty * unitCost;

  async function handleCreate() {
    if (!supplierId || qty <= 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          notes: `Auto-generated from low stock alert for ${itemName}`,
          lines: [{ itemId, quantity: qty, unitCost }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create PO");

      // Acknowledge the alert
      await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACKNOWLEDGED" }),
      });

      router.refresh();
      router.push(`/purchase-orders/${data.id}`);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSupplierId("");
    setQuantity("10");
    setError("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Draft a reorder for <span className="font-medium text-slate-700">{itemName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Supplier</Label>
            {suppliers.length === 0 ? (
              <p className="text-sm text-slate-500 rounded-lg border border-dashed border-slate-200 p-3 text-center">
                No suppliers yet.{" "}
                <a href="/suppliers" className="text-indigo-600 hover:underline">Add one first.</a>
              </p>
            ) : (
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier…" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quantity ({itemUnit})</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unit Cost</Label>
              <Input value={`$${unitCost.toFixed(2)}`} readOnly className="bg-slate-50 text-slate-500" />
            </div>
          </div>

          <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-indigo-700 font-medium">Estimated total</span>
            <span className="text-lg font-bold text-indigo-700">${total.toFixed(2)}</span>
          </div>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!supplierId || qty <= 0 || loading || suppliers.length === 0}
            >
              <ShoppingCart className="mr-1.5 h-4 w-4" />
              {loading ? "Creating…" : "Create Draft PO"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
