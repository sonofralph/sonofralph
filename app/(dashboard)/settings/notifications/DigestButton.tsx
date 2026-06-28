"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DigestButton() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/digest", { method: "GET" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed");
      } else {
        setSent(true);
        setTimeout(() => setSent(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
      <CheckCircle2 className="h-4 w-4" /> Sent!
    </span>
  );

  return (
    <div>
      {error && <p className="text-xs text-red-600 mb-1">{error}</p>}
      <Button variant="outline" size="sm" onClick={send} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        Send now
      </Button>
    </div>
  );
}
