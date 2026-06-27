import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { ArrowLeftRight } from "lucide-react";
import { TransferClient } from "./TransferClient";

export default async function TransferPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const [items, locations, records] = await Promise.all([
    prisma.item.findMany({ where: { organizationId: orgId }, select: { id: true, name: true, sku: true, unit: true }, orderBy: { name: "asc" } }),
    prisma.location.findMany({ where: { organizationId: orgId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.inventoryRecord.findMany({ where: { item: { organizationId: orgId } }, select: { itemId: true, locationId: true, quantity: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
          <ArrowLeftRight className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Stock Transfer</h1>
          <p className="text-sm text-slate-500">Move stock between locations</p>
        </div>
      </div>
      {locations.length < 2 ? (
        <p className="text-sm text-slate-400 py-10 text-center">You need at least 2 locations to transfer stock.</p>
      ) : (
        <TransferClient items={items} locations={locations} stockRecords={records} />
      )}
    </div>
  );
}
