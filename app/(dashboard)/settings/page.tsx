import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Building, CreditCard, Shield, User, Palette, Database } from "lucide-react";
import { OrgNameForm } from "./OrgNameForm";
import { getPlanLimits } from "@/lib/plans";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;

  if (!["OWNER", "ADMIN"].includes(user.role)) {
    redirect("/dashboard");
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    include: {
      _count: {
        select: { users: true, items: true, locations: true },
      },
    },
  });

  if (!org) redirect("/login");

  const limits = getPlanLimits(org.plan);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">
          Manage your organization settings and billing
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/settings/profile" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 hover:bg-slate-50 transition-colors group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
            <User className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Profile</p>
            <p className="text-xs text-slate-500">Name & password</p>
          </div>
        </Link>
        <Link href="/settings/notifications" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 hover:bg-slate-50 transition-colors group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
            <Bell className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Notifications</p>
            <p className="text-xs text-slate-500">Email alert preferences</p>
          </div>
        </Link>
        {user.role === "OWNER" && (
          <Link href="/settings/branding" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 hover:bg-slate-50 transition-colors group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
              <Palette className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Branding</p>
              <p className="text-xs text-slate-500">Logo & brand colours</p>
            </div>
          </Link>
        )}
        {user.role === "OWNER" && (
          <Link href="/settings/billing" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 hover:bg-slate-50 transition-colors group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <CreditCard className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Billing</p>
              <p className="text-xs text-slate-500">Plan, usage & invoices</p>
            </div>
          </Link>
        )}
        {user.role === "OWNER" && (
          <Link href="/settings/data" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 hover:bg-slate-50 transition-colors group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50">
              <Database className="h-4 w-4 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Data & Privacy</p>
              <p className="text-xs text-slate-500">Export data · delete account</p>
            </div>
          </Link>
        )}
      </div>

      {/* Organization info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base">Organization</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Name</p>
              <OrgNameForm initialName={org.name} isOwner={user.role === "OWNER"} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Slug
              </p>
              <code className="text-sm bg-slate-100 px-2 py-0.5 rounded">
                {org.slug}
              </code>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Deployment Mode
              </p>
              <Badge variant="secondary">{org.deploymentMode}</Badge>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Created
              </p>
              <p className="text-sm text-slate-600">
                {new Intl.DateTimeFormat("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }).format(org.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan & Usage */}
      {user.role === "OWNER" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                <CardTitle className="text-base">Plan & Usage</CardTitle>
              </div>
              <Badge variant={org.plan === "FREE" ? "secondary" : org.plan === "PRO" ? "default" : "success"}>
                {org.plan}
              </Badge>
            </div>
            <CardDescription>Your current plan usage and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Locations", used: org._count.locations, limit: limits.locations },
                { label: "Users", used: org._count.users, limit: limits.users },
                { label: "Items", used: org._count.items, limit: limits.items },
              ].map((stat) => {
                const unlimited = stat.limit === Infinity;
                const pct = unlimited ? 0 : Math.min((stat.used / stat.limit) * 100, 100);
                return (
                  <div key={stat.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{stat.label}</span>
                      <span className="font-medium text-slate-900">
                        {stat.used}{!unlimited && <span className="text-slate-400">/{stat.limit}</span>}
                      </span>
                    </div>
                    {!unlimited && (
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full transition-all ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-400" : "bg-indigo-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Link href="/settings/billing" className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
              Manage plan & billing →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base">Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Role-based access
                </p>
                <p className="text-xs text-slate-500">
                  Control what each team member can see and do
                </p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Audit logging
                </p>
                <p className="text-xs text-slate-500">
                  All stock movements are tracked with user attribution
                </p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
