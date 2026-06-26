"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

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

export function NewRecipeForm({ items }: { items: Item[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [servings, setServings] = useState(1);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [targetCostPercent, setTargetCostPercent] = useState(30);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ itemId: "", quantity: 1, unit: "" }]);

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

  const costPerServing = totalCost / servings;
  const costPercent = sellingPrice > 0 ? (costPerServing / sellingPrice) * 100 : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validIngredients = ingredients.filter((ing) => ing.itemId && ing.quantity > 0);
    if (validIngredients.length === 0) {
      setError("Add at least one ingredient");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, category, servings, sellingPrice, targetCostPercent, ingredients: validIngredients }),
    });

    if (res.ok) {
      router.push("/recipes");
      router.refresh();
    } else {
      setError("Failed to create recipe");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Recipe name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grilled Salmon Fillet" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Main Course" />
            </div>
            <div className="space-y-1.5">
              <Label>Servings</Label>
              <Input type="number" min="0.1" step="0.1" value={servings} onChange={(e) => setServings(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Selling price ($)</Label>
              <Input type="number" min="0" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Target food cost %</Label>
              <Input type="number" min="1" max="100" value={targetCostPercent} onChange={(e) => setTargetCostPercent(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">Ingredients</Label>
            <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />Add
            </Button>
          </div>

          {ingredients.map((ing, i) => {
            const item = items.find((it) => it.id === ing.itemId);
            const lineCost = item ? item.unitCost * ing.quantity : 0;
            return (
              <div key={i} className="flex items-center gap-2">
                <select
                  className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={ing.itemId}
                  onChange={(e) => updateIngredient(i, "itemId", e.target.value)}
                  required
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
                  placeholder="Qty"
                />
                <span className="w-12 text-xs text-slate-400">{ing.unit}</span>
                <span className="w-16 text-xs text-slate-500 text-right">{formatCurrency(lineCost)}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(i)} className="shrink-0">
                  <Trash2 className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Live cost summary */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(totalCost)}</p>
              <p className="text-xs text-slate-400">Total cost</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(costPerServing)}</p>
              <p className="text-xs text-slate-400">Cost / serving</p>
            </div>
            <div>
              <p className={`text-lg font-bold ${costPercent === null ? "text-slate-400" : costPercent <= targetCostPercent ? "text-emerald-600" : "text-red-600"}`}>
                {costPercent !== null ? `${costPercent.toFixed(1)}%` : "—"}
              </p>
              <p className="text-xs text-slate-400">Food cost %</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={loading || !name}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Recipe"}
        </Button>
      </div>
    </form>
  );
}
