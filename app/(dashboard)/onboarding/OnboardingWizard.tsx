"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, Package, CheckCircle2, ArrowRight, Loader2, Plus, Trash2, ChefHat,
  UtensilsCrossed, Hotel, Wine, Coffee, Truck, Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  orgName: string;
  hasLocations: boolean;
  hasItems: boolean;
}

const BUSINESS_TYPES = [
  {
    key: "RESTAURANT",
    label: "Restaurant",
    description: "Full-service or casual dining",
    icon: UtensilsCrossed,
    presets: [
      { name: "Main Kitchen", type: "KITCHEN" },
      { name: "Bar", type: "BAR" },
      { name: "Dry Store", type: "STORAGE" },
      { name: "Walk-in Freezer", type: "FREEZER" },
    ],
  },
  {
    key: "HOTEL",
    label: "Hotel",
    description: "Full-service hotel or resort",
    icon: Hotel,
    presets: [
      { name: "Main Kitchen", type: "KITCHEN" },
      { name: "Bar & Lounge", type: "BAR" },
      { name: "Housekeeping Store", type: "STORAGE" },
      { name: "Events & Banqueting", type: "OTHER" },
    ],
  },
  {
    key: "BAR",
    label: "Bar / Nightclub",
    description: "Bar, pub, or nightclub",
    icon: Wine,
    presets: [
      { name: "Back Bar", type: "BAR" },
      { name: "Cellar", type: "CELLAR" },
      { name: "Storage", type: "STORAGE" },
    ],
  },
  {
    key: "CAFE",
    label: "Café",
    description: "Coffee shop or café",
    icon: Coffee,
    presets: [
      { name: "Kitchen", type: "KITCHEN" },
      { name: "Front of House", type: "OTHER" },
      { name: "Storage", type: "STORAGE" },
    ],
  },
  {
    key: "CATERING",
    label: "Catering / Events",
    description: "Catering company or event venue",
    icon: Truck,
    presets: [
      { name: "Central Kitchen", type: "KITCHEN" },
      { name: "Event Store", type: "STORAGE" },
      { name: "Cold Store", type: "FREEZER" },
    ],
  },
  {
    key: "CLINIC",
    label: "Clinic / Hospital",
    description: "Medical facility or pharmacy",
    icon: Stethoscope,
    presets: [
      { name: "Pharmacy", type: "STORAGE" },
      { name: "Main Store", type: "STORAGE" },
      { name: "Ward Store", type: "OTHER" },
    ],
  },
] as const;

const LOCATION_TYPES = ["KITCHEN", "BAR", "STORAGE", "CELLAR", "FREEZER", "OTHER"] as const;
const ITEM_UNITS = ["kg", "g", "litre", "ml", "each", "bottle", "case", "box", "portion"];

interface LocationDraft { name: string; type: string }
interface ItemDraft { name: string; sku: string; unit: string; category: string; unitCost: string }

export function OnboardingWizard({ orgName, hasLocations, hasItems }: Props) {
  const router = useRouter();
  const initialStep = hasLocations ? 2 : 0;
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 0 — Business type
  const [businessType, setBusinessType] = useState<string>("");

  // Step 1 — Locations
  const selectedBiz = BUSINESS_TYPES.find((b) => b.key === businessType) ?? BUSINESS_TYPES[0];
  const [locations, setLocations] = useState<LocationDraft[]>([{ name: "", type: "KITCHEN" }]);

  // Step 2 — Items
  const [items, setItems] = useState<ItemDraft[]>([
    { name: "", sku: "", unit: "kg", category: "General", unitCost: "" },
  ]);

  const addLocation = () => setLocations([...locations, { name: "", type: "STORAGE" }]);
  const removeLocation = (i: number) => setLocations(locations.filter((_, idx) => idx !== i));
  const updateLocation = (i: number, field: keyof LocationDraft, value: string) => {
    const updated = [...locations];
    updated[i] = { ...updated[i], [field]: value };
    setLocations(updated);
  };
  const applyPreset = (preset: { name: string; type: string }) => {
    if (!locations.some((l) => l.name === preset.name)) {
      setLocations([...locations.filter((l) => l.name), { name: preset.name, type: preset.type }]);
    }
  };

  const addItem = () => setItems([...items, { name: "", sku: "", unit: "kg", category: "General", unitCost: "" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof ItemDraft, value: string) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };

  async function submitBusinessType() {
    if (!businessType) { setError("Please select your business type"); return; }
    setLoading(true);
    setError("");
    await fetch("/api/onboarding/business-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessType }),
    });
    setLoading(false);
    setStep(1);
  }

  async function submitLocations() {
    const valid = locations.filter((l) => l.name.trim());
    if (valid.length === 0) { setError("Add at least one location"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/onboarding/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locations: valid }),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); setLoading(false); return; }
    setStep(2);
    setLoading(false);
  }

  async function submitItems(skip = false) {
    if (skip) { router.push("/dashboard"); return; }
    const valid = items.filter((it) => it.name.trim() && it.sku.trim());
    if (valid.length === 0) { setError("Add at least one item or skip"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/inventory/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: valid.map((it) => ({
          name: it.name.trim(),
          sku: it.sku.trim(),
          unit: it.unit,
          category: it.category.trim() || "General",
          unitCost: parseFloat(it.unitCost) || 0,
        })),
      }),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); setLoading(false); return; }
    router.push("/dashboard");
  }

  const steps = [
    { label: "Business", icon: ChefHat },
    { label: "Locations", icon: MapPin },
    { label: "Items", icon: Package },
    { label: "Done", icon: CheckCircle2 },
  ];

  return (
    <div className="w-full max-w-2xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg mx-auto">
          <ChefHat className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome to Mise</h1>
        <p className="text-slate-500">Let&apos;s set up <span className="font-medium text-slate-700">{orgName}</span> in a few quick steps.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const stepNum = i;
          const done = step > stepNum;
          const active = step === stepNum;
          return (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all",
                  done ? "border-emerald-500 bg-emerald-500 text-white" :
                  active ? "border-indigo-600 bg-indigo-600 text-white" :
                  "border-slate-200 bg-white text-slate-400"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={cn("text-xs font-medium", active ? "text-indigo-600" : done ? "text-emerald-600" : "text-slate-400")}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-0.5 w-16 mx-2 mb-4 rounded transition-all", done ? "bg-emerald-400" : "bg-slate-200")} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Step 0 — Business type */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">What type of business are you?</h2>
            <p className="text-sm text-slate-500 mt-0.5">We&apos;ll pre-configure locations and features to match your operation.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BUSINESS_TYPES.map((biz) => {
              const Icon = biz.icon;
              const selected = businessType === biz.key;
              return (
                <button
                  key={biz.key}
                  type="button"
                  onClick={() => { setBusinessType(biz.key); setError(""); }}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all",
                    selected
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    selected ? "bg-indigo-600" : "bg-slate-100"
                  )}>
                    <Icon className={cn("h-4 w-4", selected ? "text-white" : "text-slate-500")} />
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold", selected ? "text-indigo-900" : "text-slate-900")}>{biz.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{biz.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <Button className="w-full" onClick={submitBusinessType} disabled={loading || !businessType}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 1 — Locations */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add your storage locations</h2>
            <p className="text-sm text-slate-500 mt-0.5">Locations are where you track stock — kitchens, bars, stores, wards.</p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Quick add for {selectedBiz.label}</p>
            <div className="flex flex-wrap gap-2">
              {selectedBiz.presets.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  + {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {locations.map((loc, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={loc.name}
                  onChange={(e) => updateLocation(i, "name", e.target.value)}
                  placeholder="Location name"
                  className="flex-1"
                />
                <select
                  value={loc.type}
                  onChange={(e) => updateLocation(i, "type", e.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {LOCATION_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                  ))}
                </select>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeLocation(i)} disabled={locations.length === 1}>
                  <Trash2 className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addLocation}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add another
            </Button>
          </div>

          <Button className="w-full" onClick={submitLocations} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 2 — Items */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add your first items</h2>
            <p className="text-sm text-slate-500 mt-0.5">Add a few key items now — you can import more via CSV any time.</p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 px-1">
              <span className="col-span-4 text-xs font-medium text-slate-500">Name *</span>
              <span className="col-span-2 text-xs font-medium text-slate-500">SKU *</span>
              <span className="col-span-2 text-xs font-medium text-slate-500">Unit</span>
              <span className="col-span-2 text-xs font-medium text-slate-500">Category</span>
              <span className="col-span-2 text-xs font-medium text-slate-500">Cost</span>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <Input className="col-span-4" value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)} placeholder="Chicken Breast" />
                <Input className="col-span-2" value={item.sku} onChange={(e) => updateItem(i, "sku", e.target.value)} placeholder="CHK-001" />
                <select
                  className="col-span-2 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={item.unit}
                  onChange={(e) => updateItem(i, "unit", e.target.value)}
                >
                  {ITEM_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <Input className="col-span-2" value={item.category} onChange={(e) => updateItem(i, "category", e.target.value)} placeholder="Meat" />
                <Input className="col-span-1" type="number" min="0" step="0.01" value={item.unitCost} onChange={(e) => updateItem(i, "unitCost", e.target.value)} placeholder="0" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} disabled={items.length === 1}>
                  <Trash2 className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add another
            </Button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => submitItems(true)} disabled={loading}>
              Skip for now
            </Button>
            <Button className="flex-1" onClick={() => submitItems(false)} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Finish setup <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
