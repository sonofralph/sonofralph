import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Zap } from "lucide-react";
import { QuickMovementClient } from "./QuickMovementClient";

export default async function QuickMovementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const [items, locations] = await Promise.all([
    prisma.item.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, sku: true, unit: true },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
          <Zap className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quick Movement</h1>
          <p className="text-sm text-slate-500">Fast issue, receipt, or wastage — optimised for mobile</p>
        </div>
      </div>

      {items.length === 0 || locations.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-slate-400">Add items and locations first.</p>
        </div>
      ) : (
        <QuickMovementClient items={items} locations={locations} />
      )}
    </div>
  );
}
