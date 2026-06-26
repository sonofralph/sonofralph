"use client";

import { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function AutoGeneratePOButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/purchase-orders/auto-generate", { method: "POST" });
      const data = await res.json();
      setMessage(data.message);
      if (data.created > 0) router.refresh();
    } catch {
      setMessage("Failed to generate PO");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {message && <p className="text-sm text-slate-500">{message}</p>}
      <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
        Auto-generate PO
      </Button>
    </div>
  );
}
