import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { NewPOForm } from "./NewPOForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewPurchaseOrderPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) {
    redirect("/dashboard/purchase-orders");
  }

  const [suppliers, items] = await Promise.all([
    prisma.supplier.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
      include: { category: true },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href="/dashboard/purchase-orders"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Purchase Orders
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          New Purchase Order
        </h1>
        <p className="text-sm text-slate-500">
          Create a purchase order to send to a supplier
        </p>
      </div>

      <NewPOForm suppliers={suppliers} items={items} />
    </div>
  );
}
