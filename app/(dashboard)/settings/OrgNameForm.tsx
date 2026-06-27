"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";

export function OrgNameForm({ initialName, isOwner }: { initialName: string; isOwner: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (name.trim() === initialName) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/organizations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to save"); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  if (!isOwner) {
    return <p className="font-semibold text-slate-900">{initialName}</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        className="h-8 w-56 text-sm"
        value={name}
        onChange={(e) => { setName(e.target.value); setSaved(false); }}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
      />
      <Button size="sm" variant="outline" onClick={handleSave} disabled={saving || name.trim() === initialName}>
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : "Save"}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
