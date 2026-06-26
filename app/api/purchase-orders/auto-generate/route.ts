import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SessionUser } from "@/types";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = user.organizationId;

  const lowStockRecords = await prisma.inventoryRecord.findMany({
    where: { item: { organizationId: orgId }, quantity: { lte: prisma.inventoryRecord.fields.reorderPoint } },
    include: { item: true },
  });

  if (lowStockRecords.length === 0) {
    return NextResponse.json({ message: "No items below reorder point", created: 0 });
  }

  const suppliers = await prisma.supplier.findMany({ where: { organizationId: orgId }, take: 1 });
  if (suppliers.length === 0) {
    return NextResponse.json({ error: "No suppliers configured" }, { status: 400 });
  }

  const expectedDate = new Date();
  expectedDate.setDate(expectedDate.getDate() + 7);

  const po = await prisma.purchaseOrder.create({
    data: {
      organizationId: orgId,
      supplierId: suppliers[0].id,
      status: "DRAFT",
      notes: `Auto-generated reorder — ${lowStockRecords.length} item(s) below reorder point`,
      expectedDate,
      lines: {
        create: lowStockRecords.map((record) => ({
          itemId: record.itemId,
          quantity: Math.max(record.reorderPoint - record.quantity, 1) * 2,
          unitCost: 0,
          receivedQty: 0,
        })),
      },
    },
  });

  return NextResponse.json({ message: `Draft PO created with ${lowStockRecords.length} line(s)`, poId: po.id, created: 1 });
}
