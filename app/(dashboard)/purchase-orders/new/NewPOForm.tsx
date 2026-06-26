"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Supplier, Item, Category } from "@/types";

interface POLine {
  itemId: string;
  quantity: number;
  unitCost: number;
}

interface NewPOFormProps {
  suppliers: Supplier[];
  items: (Item & { category: Category })[];
}

export function NewPOForm({ suppliers, items }: NewPOFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<POLine[]>([
    { itemId: "", quantity: 1, unitCost: 0 },
  ]);

  const addLine = () => {
    setLines((l) => [...l, { itemId: "", quantity: 1, unitCost: 0 }]);
  };

  const removeLine = (i: number) => {
    setLines((l) => l.filter((_, idx) => idx !== i));
  };

  const updateLine = (i: number, field: keyof POLine, value: string | number) => {
    setLines((l) =>
      l.map((line, idx) =>
        idx === i ? { ...line, [field]: value } : line
      )
    );
  };

  const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setError("Please select a supplier");
      return;
    }
    if (lines.some((l) => !l.itemId)) {
      setError("Please select an item for each line");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, expectedDate: expectedDate || null, notes, lines }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create purchase order");
      }

      router.push("/dashboard/purchase-orders");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label>Supplier</Label>
            <Select onValueChange={setSupplierId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label>Expected Delivery Date</Label>
            <Input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="space-y-1.5 col-span-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Special instructions or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Order Lines</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Line
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 px-1">
            <div className="col-span-5">Item</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-3">Unit Cost</div>
            <div className="col-span-1">Total</div>
            <div className="col-span-1"></div>
          </div>

          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <Select
                  value={line.itemId}
                  onValueChange={(v) => updateLine(i, "itemId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({item.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(i, "quantity", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={line.unitCost || ""}
                  onChange={(e) =>
                    updateLine(i, "unitCost", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="col-span-1 text-sm font-medium text-slate-700">
                {formatCurrency(line.quantity * line.unitCost)}
              </div>
              <div className="col-span-1">
                {lines.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => removeLine(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end border-t pt-3">
            <div className="text-right">
              <span className="text-sm text-slate-500">Total: </span>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Purchase Order"}
        </Button>
      </div>
    </form>
  );
}
