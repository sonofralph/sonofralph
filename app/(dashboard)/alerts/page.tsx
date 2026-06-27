import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertActions } from "./AlertActions";
import { formatDateTime } from "@/lib/utils";
import {
  AlertTriangle,
  PackageX,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { AlertType } from "@/types";

const alertTypeIcons: Record<AlertType, React.ElementType> = {
  LOW_STOCK: AlertTriangle,
  OUT_OF_STOCK: PackageX,
  EXPIRY: Clock,
};

const alertTypeColors: Record<AlertType, string> = {
  LOW_STOCK: "text-amber-600 bg-amber-50",
  OUT_OF_STOCK: "text-red-600 bg-red-50",
  EXPIRY: "text-orange-600 bg-orange-50",
};

const alertTypeBadge: Record<AlertType, any> = {
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "danger",
  EXPIRY: "warning",
};

export default async function AlertsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const [openAlerts, resolvedAlerts] = await Promise.all([
    prisma.alert.findMany({
      where: { organizationId: orgId, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      orderBy: { createdAt: "desc" },
      include: {
        item: { select: { name: true, sku: true, unit: true } },
        location: { select: { name: true } },
      },
    }),
    prisma.alert.findMany({
      where: { organizationId: orgId, status: "RESOLVED" },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        item: { select: { name: true, sku: true } },
        location: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
        <p className="text-sm text-slate-500">
          {openAlerts.length} active alert{openAlerts.length !== 1 ? "s" : ""}{" "}
          requiring attention
        </p>
      </div>

      {/* Active alerts */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Active Alerts
        </h2>

        {openAlerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-green-400 mb-3" />
            <p className="font-medium text-slate-700">All clear!</p>
            <p className="text-sm text-slate-400">
              No active alerts. Your inventory levels look good.
            </p>
          </div>
        ) : (
          openAlerts.map((alert) => {
            const Icon = alertTypeIcons[alert.type as AlertType] ?? AlertTriangle;
            const colorClass =
              alertTypeColors[alert.type as AlertType] ?? "text-slate-600 bg-slate-50";

            return (
              <div
                key={alert.id}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${colorClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">
                      {alert.item.name}
                    </p>
                    <Badge variant={alertTypeBadge[alert.type as AlertType]}>
                      {alert.type.replace("_", " ")}
                    </Badge>
                    {alert.status === "ACKNOWLEDGED" && (
                      <Badge variant="secondary">Acknowledged</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {alert.location.name} · SKU: {alert.item.sku}
                  </p>
                  {alert.message && (
                    <p className="text-sm text-slate-600 mt-1">
                      {alert.message}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDateTime(alert.createdAt)}
                  </p>
                </div>

                <AlertActions
                  alertId={alert.id}
                  currentStatus={alert.status}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Recently resolved */}
      {resolvedAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Recently Resolved
          </h2>
          {resolvedAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 opacity-60"
            >
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  {alert.item.name} — {alert.type.replace("_", " ")}
                </p>
                <p className="text-xs text-slate-400">
                  {alert.location.name} · Resolved{" "}
                  {formatDateTime(alert.updatedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
