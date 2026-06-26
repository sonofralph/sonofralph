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
import { Building, CreditCard, Shield } from "lucide-react";

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

  const planLimits = {
    FREE: { items: 100, users: 3, locations: 2 },
    PRO: { items: 1000, users: 20, locations: 10 },
    ENTERPRISE: { items: -1, users: -1, locations: -1 },
  };

  const limits = planLimits[org.plan];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">
          Manage your organization settings and billing
        </p>
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
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Name
              </p>
              <p className="font-semibold text-slate-900">{org.name}</p>
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-base">Plan & Usage</CardTitle>
            </div>
            <Badge
              variant={
                org.plan === "FREE"
                  ? "secondary"
                  : org.plan === "PRO"
                  ? "default"
                  : "success"
              }
            >
              {org.plan}
            </Badge>
          </div>
          <CardDescription>
            Your current plan usage and limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Items",
                used: org._count.items,
                limit: limits.items,
              },
              {
                label: "Users",
                used: org._count.users,
                limit: limits.users,
              },
              {
                label: "Locations",
                used: org._count.locations,
                limit: limits.locations,
              },
            ].map((stat) => {
              const pct =
                stat.limit === -1 ? 0 : (stat.used / stat.limit) * 100;
              return (
                <div key={stat.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{stat.label}</span>
                    <span className="font-medium text-slate-900">
                      {stat.used}
                      {stat.limit !== -1 && (
                        <span className="text-slate-400">/{stat.limit}</span>
                      )}
                    </span>
                  </div>
                  {stat.limit !== -1 && (
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          pct > 90
                            ? "bg-red-500"
                            : pct > 70
                            ? "bg-amber-500"
                            : "bg-indigo-500"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {org.plan === "FREE" && (
            <div className="mt-4 rounded-lg bg-indigo-50 border border-indigo-100 p-4">
              <p className="text-sm font-medium text-indigo-900">
                Upgrade to Pro
              </p>
              <p className="text-xs text-indigo-600 mt-0.5">
                Get unlimited items, more users, and advanced reporting.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
