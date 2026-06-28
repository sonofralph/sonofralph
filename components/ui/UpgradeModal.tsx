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
import { Loader2, Zap, ArrowRight } from "lucide-react";

const RESOURCE_COPY: Record<string, { noun: string; proUnlock: string; enterpriseUnlock: string }> = {
  locations: {
    noun: "location",
    proUnlock: "up to 5 locations across your operation",
    enterpriseUnlock: "unlimited locations across every site",
  },
  users: {
    noun: "team member",
    proUnlock: "up to 20 team members",
    enterpriseUnlock: "unlimited team members with role-based access",
  },
  items: {
    noun: "item",
    proUnlock: "unlimited inventory items",
    enterpriseUnlock: "unlimited inventory items",
  },
};

// Update this to your Mise sales/contact email before go-live
const ENTERPRISE_CONTACT = "hello@mise.app";

interface Props {
  open: boolean;
  onClose: () => void;
  resource: "locations" | "users" | "items";
  current: number;
  limit: number;
  currentPlan?: string;
}

export function UpgradeModal({ open, onClose, resource, current, limit, currentPlan = "FREE" }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const copy = RESOURCE_COPY[resource] ?? { noun: resource, proUnlock: "more", enterpriseUnlock: "unlimited" };
  const isPro = currentPlan === "PRO";

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

  async function handlePortal() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
      return;
    }
    setLoading(false);
  }

  if (isPro) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 mb-3">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle>Scale to Enterprise</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm text-slate-600">
            <p>
              You&apos;ve reached the <strong>Pro plan limit</strong> of {limit}{" "}
              {copy.noun}{limit !== 1 ? "s" : ""} — your operation is growing.
            </p>
            <p>
              <strong>Mise Enterprise</strong> gives you {copy.enterpriseUnlock},
              unlimited team members, dedicated onboarding, and custom pricing
              built around your group.
            </p>
            <p>
              Get in touch and we&apos;ll have you set up within 24 hours.
            </p>
            {error && <p className="text-red-600 text-xs">{error}</p>}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
            <Button variant="outline" onClick={handlePortal} disabled={loading}>
              Manage current plan
            </Button>
            <a
              href={`mailto:${ENTERPRISE_CONTACT}?subject=Mise Enterprise enquiry&body=Hi, I'm on the Pro plan and I'd like to learn more about Enterprise.`}
              className="inline-flex items-center justify-center rounded-md bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 transition-colors"
              onClick={onClose}
            >
              Talk to us <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
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
            Your organisation is on the <strong>Free plan</strong>, which
            includes {limit} {copy.noun}{limit !== 1 ? "s" : ""}.
          </p>
          <p>
            Upgrade to <strong>Mise Pro</strong> to unlock {copy.proUnlock},
            up to 20 team members, and unlimited inventory items — starting at{" "}
            <strong>$49/month</strong> with a{" "}
            <strong>14-day free trial, no card needed upfront</strong>.
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
