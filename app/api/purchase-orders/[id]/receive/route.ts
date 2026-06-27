import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SessionUser } from "@/types";
import { z } from "zod";

const schema = z.object({
  lines: z.array(z.object({ lineId: z.string(), qty: z.number().min(0) })),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const po = await prisma.purchaseOrder.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { lines: { include: { item: true } } },
  });
  if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });
  if (po.status === "RECEIVED" || po.status === "CANCELLED")
    return NextResponse.json({ error: "PO is already closed" }, { status: 400 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { lines } = parsed.data;

  await prisma.$transaction(async (tx) => {
    for (const { lineId, qty } of lines) {
      if (qty <= 0) continue;
      const line = po.lines.find((l) => l.id === lineId);
      if (!line) continue;

      const actualQty = Math.min(qty, line.quantity - line.receivedQty);
      if (actualQty <= 0) continue;

      await tx.purchaseOrderLine.update({
        where: { id: lineId },
        data: { receivedQty: { increment: actualQty } },
      });

      // Find a location — use first location for org, or skip if none
      const location = await tx.location.findFirst({ where: { organizationId: user.organizationId } });
      if (location) {
        await tx.inventoryRecord.upsert({
          where: { itemId_locationId: { itemId: line.itemId, locationId: location.id } },
          create: { itemId: line.itemId, locationId: location.id, quantity: actualQty, minStock: 0, maxStock: 1000, reorderPoint: 10, lastUpdated: new Date() },
          update: { quantity: { increment: actualQty }, lastUpdated: new Date() },
        });

        await tx.stockMovement.create({
          data: { itemId: line.itemId, locationId: location.id, type: "RECEIPT", quantity: actualQty, reference: `PO-${po.id.slice(-6).toUpperCase()}`, userId: user.id, notes: `Received from PO` },
        });
      }
    }

    // Refresh lines to check completion
    const updatedLines = await tx.purchaseOrderLine.findMany({ where: { purchaseOrderId: id } });
    const allReceived = updatedLines.every((l) => l.receivedQty >= l.quantity);
    const anyReceived = updatedLines.some((l) => l.receivedQty > 0);

    await tx.purchaseOrder.update({
      where: { id },
      data: { status: allReceived ? "RECEIVED" : anyReceived ? "PARTIAL" : po.status },
    });

    await prisma.auditLog.create({
      data: { organizationId: user.organizationId, userId: user.id, action: "UPDATE", entity: "PurchaseOrder", entityId: id, changes: JSON.stringify({ action: "receive", lines: lines.filter((l) => l.qty > 0) }) },
    });
  });

  return NextResponse.json({ success: true });
}
