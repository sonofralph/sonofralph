import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { PLAN_LIMITS, getPlanLimits, isActive } from "@/lib/plans";
import { BillingActions } from "./BillingActions";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; banner?: string }> = {
  ACTIVE:    { label: "Active",    color: "success",   icon: CheckCircle2 },
  TRIALING:  { label: "Trial",     color: "default",   icon: Clock,        banner: "You're in your 14-day free trial. Your card will be charged $49 after the trial unless you cancel." },
  PAST_DUE:  { label: "Past due",  color: "destructive", icon: AlertTriangle, banner: "Your last payment failed. Please update your payment method to keep Pro access." },
  CANCELLED: { label: "Cancelled", color: "secondary", icon: XCircle,      banner: "Your plan has been cancelled. You'll revert to the Free plan at the end of your billing period." },
};

const PLAN_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  FREE:       { label: "Free",       color: "secondary", description: "1 location · 3 team members · 50 items" },
  PRO:        { label: "Pro",        color: "default",   description: "5 locations · 20 team members · unlimited items" },
  ENTERPRISE: { label: "Enterprise", color: "warning",   description: "Unlimited everything · dedicated support" },
};

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;

  if (user.role !== "OWNER") redirect("/settings");

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: {
      plan: true,
      planStatus: true,
      trialEndsAt: true,
      stripeCustomerId: true,
      _count: { select: { locations: true, users: true, items: true } },
    },
  });

  if (!org) redirect("/login");

  const effectivePlan = isActive(org.planStatus) ? org.plan : "FREE";
  const limits = getPlanLimits(effectivePlan);
  const planConf = PLAN_CONFIG[org.plan] ?? PLAN_CONFIG.FREE;
  const statusConf = STATUS_CONFIG[org.planStatus] ?? STATUS_CONFIG.ACTIVE;

  const trialDaysLeft = org.trialEndsAt
    ? Math.max(0, Math.ceil((org.trialEndsAt.getTime() - Date.now()) / 86_400_000))
    : null;

  const usage = [
    { label: "Locations", used: org._count.locations, limit: limits.locations },
    { label: "Team members", used: org._count.users, limit: limits.users },
    { label: "Items", used: org._count.items, limit: limits.items },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Plan & Billing</h1>
        <p className="text-sm text-slate-500">Manage your subscription and monitor usage.</p>
      </div>

      {/* Status banner */}
      {statusConf.banner && (
        <div className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm border ${
          org.planStatus === "PAST_DUE"
            ? "bg-red-50 border-red-200 text-red-800"
            : org.planStatus === "CANCELLED"
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-indigo-50 border-indigo-200 text-indigo-800"
        }`}>
          <statusConf.icon className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{statusConf.banner}
            {org.planStatus === "TRIALING" && trialDaysLeft !== null && (
              <strong> {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining.</strong>
            )}
          </p>
        </div>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-base">Current plan</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={planConf.color as "default" | "secondary" | "warning"}>{planConf.label}</Badge>
              <Badge variant={statusConf.color as "default" | "secondary" | "success" | "destructive"}>{statusConf.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500">{planConf.description}</p>

          {org.plan === "FREE" && (
            <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-4 space-y-1">
              <p className="text-sm font-semibold text-indigo-900">Ready to grow?</p>
              <p className="text-xs text-indigo-700">
                Pro gives you 5 locations, 20 team members, unlimited items, and a 14-day free trial — no card charged until the trial ends.
              </p>
            </div>
          )}

          <BillingActions
            plan={org.plan}
            planStatus={org.planStatus}
            hasStripeCustomer={!!org.stripeCustomerId}
          />
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {usage.map(({ label, used, limit }) => {
            const unlimited = limit === Infinity;
            const pct = unlimited ? 0 : Math.min((used / limit) * 100, 100);
            const atLimit = !unlimited && used >= limit;
            const nearLimit = !unlimited && pct >= 80 && !atLimit;

            return (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 font-medium">{label}</span>
                  <span className={atLimit ? "text-red-600 font-semibold" : nearLimit ? "text-amber-600 font-medium" : "text-slate-500"}>
                    {used}{unlimited ? "" : ` / ${limit}`}
                    {atLimit && " — limit reached"}
                    {nearLimit && " — approaching limit"}
                  </span>
                </div>
                {!unlimited && (
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        atLimit ? "bg-red-500" : nearLimit ? "bg-amber-400" : "bg-indigo-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
                {unlimited && (
                  <p className="text-xs text-slate-400">No limit on your plan</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Invoice access */}
      {org.stripeCustomerId && org.plan !== "FREE" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Invoices & payment history</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-3">
              View past invoices, download receipts, and update your payment method in the Stripe billing portal.
            </p>
            <BillingActions
              plan={org.plan}
              planStatus={org.planStatus}
              hasStripeCustomer={!!org.stripeCustomerId}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
