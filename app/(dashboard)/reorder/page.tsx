import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { RefreshCw } from "lucide-react";
import { ReorderClient } from "./ReorderClient";

export default async function ReorderPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const [records, suppliers] = await Promise.all([
    prisma.inventoryRecord.findMany({
      where: { item: { organizationId: orgId } },
      include: { item: { include: { category: true } }, location: true },
    }),
    prisma.supplier.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const lowStock = records.filter((r) => r.quantity <= r.reorderPoint);

  const items = lowStock.map((r) => {
    const suggestedQty = Math.max(1, Math.ceil(r.maxStock - r.quantity));
    return {
      recordId: r.id,
      itemId: r.itemId,
      itemName: r.item.name,
      sku: r.item.sku,
      unit: r.item.unit,
      locationName: r.location.name,
      quantity: r.quantity,
      reorderPoint: r.reorderPoint,
      maxStock: r.maxStock,
      unitCost: r.item.unitCost,
      suggestedQty,
      supplierId: null,
      supplierName: null,
    };
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
          <RefreshCw className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reorder Suggestions</h1>
          <p className="text-sm text-slate-500">
            Items at or below reorder point · select, adjust quantities, and create a draft PO in one click
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <RefreshCw className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-base font-semibold text-slate-700">All stocked up</p>
          <p className="text-sm text-slate-400">No items are currently below their reorder point.</p>
        </div>
      ) : (
        <ReorderClient items={items} suppliers={suppliers} />
      )}
    </div>
  );
}
