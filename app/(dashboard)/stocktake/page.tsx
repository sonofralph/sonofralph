import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { ClipboardList } from "lucide-react";
import { StocktakeClient } from "./StocktakeClient";

export default async function StocktakePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) redirect("/dashboard");

  const [locations, records] = await Promise.all([
    prisma.location.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
    prisma.inventoryRecord.findMany({
      where: { item: { organizationId: orgId } },
      include: { item: true, location: true },
      orderBy: { item: { name: "asc" } },
    }),
  ]);

  // Group records by locationId for the client
  const recordsByLocation: Record<string, {
    recordId: string;
    itemId: string;
    name: string;
    sku: string;
    unit: string;
    currentQty: number;
  }[]> = {};

  for (const r of records) {
    if (!recordsByLocation[r.locationId]) recordsByLocation[r.locationId] = [];
    recordsByLocation[r.locationId].push({
      recordId: r.id,
      itemId: r.itemId,
      name: r.item.name,
      sku: r.item.sku,
      unit: r.item.unit,
      currentQty: r.quantity,
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
          <ClipboardList className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Stocktake / Cycle Count</h1>
          <p className="text-sm text-slate-500">
            Enter physical counts — discrepancies are auto-adjusted with ADJUSTMENT movements
          </p>
        </div>
      </div>

      {locations.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-slate-400">No locations found. Add locations first.</p>
        </div>
      ) : (
        <StocktakeClient
          locations={locations.map((l) => ({ id: l.id, name: l.name }))}
          recordsByLocation={recordsByLocation}
        />
      )}
    </div>
  );
}
