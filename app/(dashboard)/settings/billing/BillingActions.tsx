"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, ArrowRight, CreditCard } from "lucide-react";

interface Props {
  plan: string;
  planStatus: string;
  hasStripeCustomer: boolean;
}

export function BillingActions({ plan, planStatus, hasStripeCustomer }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function goToCheckout() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Something went wrong — please try again");
    setLoading(false);
  }

  async function goToPortal() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Could not open billing portal — please try again");
    setLoading(false);
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">{error}</p>
    );
  }

  if (plan === "FREE") {
    return (
      <Button onClick={goToCheckout} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
        Upgrade to Pro — $49/mo
      </Button>
    );
  }

  if (plan === "PRO") {
    if (planStatus === "PAST_DUE") {
      return (
        <Button onClick={goToPortal} disabled={loading} variant="destructive">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
          Update payment method
        </Button>
      );
    }
    return (
      <Button onClick={goToPortal} disabled={loading} variant="outline">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
        {planStatus === "CANCELLED" ? "Reactivate Pro" : "Manage plan"}
      </Button>
    );
  }

  if (plan === "ENTERPRISE") {
    return (
      <a
        href="mailto:hello@mise.app?subject=Enterprise plan change&body=Hi, I'd like to discuss a change to our Enterprise plan."
        className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 underline underline-offset-4"
      >
        Contact us to make changes <ArrowRight className="h-3.5 w-3.5" />
      </a>
    );
  }

  return null;
}
