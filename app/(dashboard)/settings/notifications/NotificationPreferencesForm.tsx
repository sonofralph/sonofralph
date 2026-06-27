"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

const ALERT_CONFIGS = [
  {
    type: "LOW_STOCK",
    label: "Low Stock Alerts",
    description: "Email when an item falls at or below its reorder point",
  },
  {
    type: "OUT_OF_STOCK",
    label: "Out of Stock Alerts",
    description: "Email when an item quantity reaches zero",
  },
  {
    type: "EXPIRY",
    label: "Expiry Alerts",
    description: "Email when items are approaching their expiry date",
  },
];

type Pref = { alertType: string; email: boolean };

export function NotificationPreferencesForm({ initialPrefs }: { initialPrefs: Pref[] }) {
  const [prefs, setPrefs] = useState<Pref[]>(initialPrefs);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = async (alertType: string, email: boolean) => {
    setPrefs((prev) =>
      prev.map((p) => (p.alertType === alertType ? { ...p, email } : p))
    );
    setSaved(null);
    setError(null);

    try {
      const res = await fetch("/api/users/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertType, email }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save");
        // revert
        setPrefs((prev) =>
          prev.map((p) => (p.alertType === alertType ? { ...p, email: !email } : p))
        );
      } else {
        setSaved(alertType);
        setTimeout(() => setSaved(null), 2000);
      }
    } catch {
      setError("Something went wrong");
      setPrefs((prev) =>
        prev.map((p) => (p.alertType === alertType ? { ...p, email: !email } : p))
      );
    }
  };

  const getPref = (type: string) => prefs.find((p) => p.alertType === type)?.email ?? true;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {ALERT_CONFIGS.map((cfg) => (
        <div
          key={cfg.type}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Label htmlFor={`pref-${cfg.type}`} className="text-sm font-semibold text-slate-900 cursor-pointer">
                {cfg.label}
              </Label>
              {saved === cfg.type && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  Saved
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">{cfg.description}</p>
          </div>
          <Switch
            id={`pref-${cfg.type}`}
            checked={getPref(cfg.type)}
            onCheckedChange={(checked) => toggle(cfg.type, checked)}
          />
        </div>
      ))}
    </div>
  );
}
