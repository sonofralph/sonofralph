"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Palette, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESET_COLORS = [
  "#4f46e5", // indigo (default)
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo-alt
];

interface Props {
  initialLogoUrl: string | null;
  initialBrandColor: string | null;
  initialShowOnPublicWall: boolean;
}

export function BrandingForm({ initialLogoUrl, initialBrandColor, initialShowOnPublicWall }: Props) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? "");
  const [brandColor, setBrandColor] = useState(initialBrandColor ?? "#4f46e5");
  const [showOnPublicWall, setShowOnPublicWall] = useState(initialShowOnPublicWall);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: logoUrl.trim() || null,
          brandColor,
          showOnPublicWall,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Save failed"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Logo */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-slate-500" />
          <Label className="text-sm font-semibold text-slate-700">Organisation Logo</Label>
        </div>
        <p className="text-xs text-slate-400">Paste a public URL to your logo (PNG or SVG recommended, square format works best)</p>
        <Input
          placeholder="https://yourdomain.com/logo.png"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="max-w-lg"
        />
        {logoUrl && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 w-fit">
            <img
              src={logoUrl}
              alt="Logo preview"
              className="h-10 w-10 rounded-lg object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <p className="text-xs text-slate-500">Logo preview</p>
          </div>
        )}
      </div>

      {/* Brand color */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-slate-500" />
          <Label className="text-sm font-semibold text-slate-700">Brand Colour</Label>
        </div>
        <p className="text-xs text-slate-400">Used for sidebar accent, buttons, and highlights throughout the app</p>

        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setBrandColor(c)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${brandColor === c ? "border-slate-900 scale-110" : "border-transparent hover:scale-105"}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          <div className="flex items-center gap-2 ml-2">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-full border border-slate-200"
              title="Custom colour"
            />
            <span className="text-xs text-slate-400 font-mono">{brandColor}</span>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 max-w-xs">
          <p className="text-xs text-slate-400 mb-3">Preview</p>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: brandColor }}>
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-sm font-bold text-slate-900">Your App</span>
          </div>
          <button className="w-full rounded-lg py-2 text-sm font-semibold text-white" style={{ backgroundColor: brandColor }}>
            Primary Button
          </button>
        </div>
      </div>

      {/* Public wall opt-in */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-slate-700">Show on public "Trusted by" wall</Label>
        </div>
        <p className="text-xs text-slate-400">Display your organisation name on the Mise homepage to show your support</p>
        <label className="flex items-center gap-3 cursor-pointer w-fit">
          <div
            onClick={() => setShowOnPublicWall((v) => !v)}
            className={`relative h-5 w-9 rounded-full transition-colors ${showOnPublicWall ? "bg-indigo-600" : "bg-slate-200"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showOnPublicWall ? "translate-x-4" : "translate-x-0"}`}
            />
          </div>
          <span className="text-sm text-slate-600">{showOnPublicWall ? "Listed" : "Hidden"}</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle2 className="h-4 w-4" /> Saved — reload to see changes
          </span>
        )}
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4" />}
          Save Branding
        </Button>
      </div>
    </div>
  );
}
