"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
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
import { MovementType } from "@prisma/client";

const movementSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  locationId: z.string().min(1, "Location is required"),
  type: z.nativeEnum(MovementType),
  quantity: z.number().positive("Quantity must be positive"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

interface MovementFormProps {
  items: { id: string; name: string; sku: string; unit: string }[];
  locations: { id: string; name: string; type: string }[];
  onSuccess?: () => void;
}

const movementTypeLabels: Record<MovementType, string> = {
  RECEIPT: "Receipt (Stock In)",
  ISSUE: "Issue (Stock Out)",
  TRANSFER: "Transfer",
  ADJUSTMENT: "Adjustment",
  WASTAGE: "Wastage",
};

export function MovementForm({ items, locations, onSuccess }: MovementFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    itemId: "",
    locationId: "",
    type: "RECEIPT" as MovementType,
    quantity: "",
    reference: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = movementSchema.safeParse({
      ...form,
      quantity: parseFloat(form.quantity),
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to record movement");
      }

      setForm({
        itemId: "",
        locationId: "",
        type: "RECEIPT",
        quantity: "",
        reference: "",
        notes: "",
      });
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Item</Label>
          <Select
            value={form.itemId}
            onValueChange={(v) => setForm((f) => ({ ...f, itemId: v }))}
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
          {fieldErrors.itemId && (
            <p className="text-xs text-red-600">{fieldErrors.itemId}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Location</Label>
          <Select
            value={form.locationId}
            onValueChange={(v) => setForm((f) => ({ ...f, locationId: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location..." />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.locationId && (
            <p className="text-xs text-red-600">{fieldErrors.locationId}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Movement Type</Label>
          <Select
            value={form.type}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, type: v as MovementType }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(movementTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Quantity</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
          />
          {fieldErrors.quantity && (
            <p className="text-xs text-red-600">{fieldErrors.quantity}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Reference / PO Number</Label>
        <Input
          placeholder="e.g. PO-2024-001, INV-123"
          value={form.reference}
          onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea
          placeholder="Additional notes..."
          rows={2}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setForm({
              itemId: "",
              locationId: "",
              type: "RECEIPT",
              quantity: "",
              reference: "",
              notes: "",
            })
          }
        >
          Reset
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Recording..." : "Record Movement"}
        </Button>
      </div>
    </form>
  );
}
