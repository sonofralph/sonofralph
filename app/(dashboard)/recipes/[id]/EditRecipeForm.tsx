"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  name: string;
  unit: string;
  unitCost: number;
  sku: string;
}

interface Ingredient {
  itemId: string;
  quantity: number;
  unit: string;
}

interface Props {
  recipeId: string;
  defaultValues: {
    name: string;
    description: string;
    category: string;
    servings: number;
    sellingPrice: number;
    targetCostPercent: number;
    ingredients: Ingredient[];
  };
  items: Item[];
  canEdit: boolean;
}

export function EditRecipeForm({ recipeId, defaultValues, items, canEdit }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(defaultValues.name);
  const [description, setDescription] = useState(defaultValues.description);
  const [category, setCategory] = useState(defaultValues.category);
  const [servings, setServings] = useState(defaultValues.servings);
  const [sellingPrice, setSellingPrice] = useState(defaultValues.sellingPrice);
  const [targetCostPercent, setTargetCostPercent] = useState(defaultValues.targetCostPercent);
  const [ingredients, setIngredients] = useState<Ingredient[]>(defaultValues.ingredients);

  const addIngredient = () => setIngredients([...ingredients, { itemId: "", quantity: 1, unit: "" }]);
  const removeIngredient = (i: number) => setIngredients(ingredients.filter((_, idx) => idx !== i));

  const updateIngredient = (i: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredients];
    if (field === "itemId") {
      const item = items.find((it) => it.id === value);
      updated[i] = { ...updated[i], itemId: value as string, unit: item?.unit ?? "" };
    } else {
      updated[i] = { ...updated[i], [field]: value };
    }
    setIngredients(updated);
  };

  const totalCost = ingredients.reduce((sum, ing) => {
    const item = items.find((it) => it.id === ing.itemId);
    return sum + (item ? item.unitCost * ing.quantity : 0);
  }, 0);

  const costPerServing = servings > 0 ? totalCost / servings : 0;
  const costPercent = sellingPrice > 0 ? (costPerServing / sellingPrice) * 100 : null;
  const margin = sellingPrice > 0 ? sellingPrice - costPerServing : null;

  const costStatus =
    costPercent === null ? "unknown" :
    costPercent <= targetCostPercent ? "good" :
    costPercent <= targetCostPercent * 1.2 ? "warning" : "over";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const validIngredients = ingredients.filter((ing) => ing.itemId && ing.quantity > 0);
    if (validIngredients.length === 0) {
      setError("Add at least one ingredient");
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/recipes/${recipeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, category, servings, sellingPrice, targetCostPercent, ingredients: validIngredients }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to save");
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
    router.push("/recipes");
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Live cost summary banner */}
      <div className={cn(
        "rounded-xl border px-5 py-4 grid grid-cols-2 gap-4 sm:grid-cols-4",
        costStatus === "good" ? "bg-emerald-50 border-emerald-200" :
        costStatus === "warning" ? "bg-amber-50 border-amber-200" :
        costStatus === "over" ? "bg-red-50 border-red-200" :
        "bg-slate-50 border-slate-200"
      )}>
        <div className="text-center">
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalCost)}</p>
          <p className="text-xs text-slate-500">Total cost</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-slate-900">{formatCurrency(costPerServing)}</p>
          <p className="text-xs text-slate-500">Per serving</p>
        </div>
        <div className="text-center">
          <p className={cn("text-xl font-bold",
            costStatus === "good" ? "text-emerald-600" :
            costStatus === "over" ? "text-red-600" :
            costStatus === "warning" ? "text-amber-600" : "text-slate-400"
          )}>
            {costPercent !== null ? `${costPercent.toFixed(1)}%` : "—"}
          </p>
          <p className="text-xs text-slate-500">Food cost %</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-slate-900">{margin !== null ? formatCurrency(margin) : "—"}</p>
          <p className="text-xs text-slate-500">Margin/serving</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Recipe name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required disabled={!canEdit} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Main Course" disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>Servings</Label>
              <Input type="number" min="0.1" step="0.1" value={servings} onChange={(e) => setServings(Number(e.target.value))} disabled={!canEdit} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Selling price ($)</Label>
              <Input type="number" min="0" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>Target food cost %</Label>
              <Input type="number" min="1" max="100" value={targetCostPercent} onChange={(e) => setTargetCostPercent(Number(e.target.value))} disabled={!canEdit} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes" disabled={!canEdit} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">Ingredients</Label>
            {canEdit && (
              <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Add
              </Button>
            )}
          </div>

          {ingredients.map((ing, i) => {
            const item = items.find((it) => it.id === ing.itemId);
            const lineCost = item ? item.unitCost * ing.quantity : 0;
            const pct = totalCost > 0 ? (lineCost / totalCost) * 100 : 0;
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <select
                    className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                    value={ing.itemId}
                    onChange={(e) => updateIngredient(i, "itemId", e.target.value)}
                    disabled={!canEdit}
                  >
                    <option value="">Select ingredient</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="w-24"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(i, "quantity", Number(e.target.value))}
                    disabled={!canEdit}
                  />
                  <span className="w-10 text-xs text-slate-400 shrink-0">{ing.unit}</span>
                  <div className="w-20 text-right shrink-0">
                    <p className="text-xs font-medium text-slate-700">{formatCurrency(lineCost)}</p>
                    <p className="text-[10px] text-slate-400">{pct.toFixed(0)}% of cost</p>
                  </div>
                  {canEdit && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(i)} className="shrink-0">
                      <Trash2 className="h-4 w-4 text-slate-400" />
                    </Button>
                  )}
                </div>
                {/* Cost bar per ingredient */}
                <div className="ml-0 h-1 w-full rounded-full bg-slate-100">
                  <div className="h-1 rounded-full bg-indigo-400 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {canEdit && (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete Recipe
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={loading || !name}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
