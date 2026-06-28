"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";

const RESOURCE_COPY: Record<string, { noun: string; proUnlock: string }> = {
  locations: { noun: "location", proUnlock: "up to 5 locations" },
  users: { noun: "team member", proUnlock: "up to 20 team members" },
  items: { noun: "item", proUnlock: "unlimited items" },
};

interface Props {
  open: boolean;
  onClose: () => void;
  resource: "locations" | "users" | "items";
  current: number;
  limit: number;
}

export function UpgradeModal({ open, onClose, resource, current, limit }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const copy = RESOURCE_COPY[resource] ?? { noun: resource, proUnlock: "more" };

  async function handleUpgrade() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Failed to start checkout — please try again");
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 mb-3">
            <Zap className="h-5 w-5 text-indigo-600" />
          </div>
          <DialogTitle>Upgrade to Mise Pro</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm text-slate-600">
          <p>
            You&apos;ve reached the <strong>Free plan limit</strong> of {limit}{" "}
            {copy.noun}{limit !== 1 ? "s" : ""} ({current}/{limit} used).
          </p>
          <p>
            Upgrade to <strong>Mise Pro</strong> to unlock {copy.proUnlock},
            priority support, and everything your growing operation needs —
            starting at <strong>$49/month</strong> with a{" "}
            <strong>14-day free trial</strong>.
          </p>
          {error && <p className="text-red-600 text-xs">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Maybe later
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
