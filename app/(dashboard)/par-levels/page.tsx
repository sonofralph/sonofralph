import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Target } from "lucide-react";
import { ParLevelsClient } from "./ParLevelsClient";

export default async function ParLevelsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) redirect("/dashboard");

  const records = await prisma.inventoryRecord.findMany({
    where: { item: { organizationId: user.organizationId } },
    include: { item: true, location: { select: { name: true } } },
    orderBy: [{ location: { name: "asc" } }, { item: { name: "asc" } }],
  });

  const initialRecords = records.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    itemName: r.item.name,
    sku: r.item.sku,
    unit: r.item.unit,
    locationName: r.location.name,
    quantity: r.quantity,
    parLevel: r.maxStock,
    reorderPoint: r.reorderPoint,
    minStock: r.minStock,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
          <Target className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Par Level Management</h1>
          <p className="text-sm text-slate-500">Set target stock levels, reorder points, and minimum quantities per item per location</p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-slate-400">Add items and assign them to locations first.</p>
        </div>
      ) : (
        <ParLevelsClient initialRecords={initialRecords} />
      )}
    </div>
  );
}
