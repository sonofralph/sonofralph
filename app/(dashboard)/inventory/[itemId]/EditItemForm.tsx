"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface Category {
  id: string;
  name: string;
}

interface Props {
  itemId: string;
  defaultValues: {
    name: string;
    sku: string;
    description: string;
    unit: string;
    unitCost: number;
    expiryDays: number | null;
    categoryId: string;
    trackingType: string;
  };
  categories: Category[];
  canEdit: boolean;
  canDelete: boolean;
}

export function EditItemForm({ itemId, defaultValues, categories, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(defaultValues.name);
  const [sku, setSku] = useState(defaultValues.sku);
  const [description, setDescription] = useState(defaultValues.description);
  const [unit, setUnit] = useState(defaultValues.unit);
  const [unitCost, setUnitCost] = useState(defaultValues.unitCost);
  const [expiryDays, setExpiryDays] = useState(defaultValues.expiryDays?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(defaultValues.categoryId);
  const [trackingType, setTrackingType] = useState(defaultValues.trackingType ?? "CONSUMABLE");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/inventory/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        sku,
        description: description || undefined,
        unit,
        unitCost,
        categoryId,
        expiryDays: expiryDays ? parseInt(expiryDays) : null,
        trackingType,
      }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json();
      setError(typeof d.error === "string" ? d.error : "Failed to save");
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This will remove all inventory records and movements for this item.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/inventory/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/inventory");
    } else {
      const d = await res.json();
      setError(typeof d.error === "string" ? d.error : "Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Item name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>SKU *</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} required disabled={!canEdit} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <select
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={!canEdit}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Unit *</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, litre, each…" required disabled={!canEdit} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Unit cost ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry (days) <span className="text-slate-400 font-normal">— optional</span></Label>
              <Input
                type="number"
                min="1"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                placeholder="e.g. 7"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tracking type</Label>
              <select
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                value={trackingType}
                onChange={(e) => setTrackingType(e.target.value)}
                disabled={!canEdit}
              >
                <option value="CONSUMABLE">Consumable</option>
                <option value="REUSABLE">Reusable</option>
                <option value="ASSET">Asset</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes" disabled={!canEdit} />
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <div className="flex items-center justify-between">
          {canDelete ? (
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete Item
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={loading || !name || !sku}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
