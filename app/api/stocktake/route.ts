import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const schema = z.object({
  locationId: z.string().min(1),
  counts: z.array(z.object({
    itemId: z.string().min(1),
    recordId: z.string().min(1),
    physicalQty: z.number().min(0),
    currentQty: z.number(),
  })),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { locationId, counts, notes } = parsed.data;

  // Verify location belongs to org
  const location = await prisma.location.findFirst({
    where: { id: locationId, organizationId: user.organizationId },
  });
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  // Verify every itemId and recordId belongs to this org before touching the DB
  const itemIds = counts.map((c) => c.itemId);
  const orgItems = await prisma.item.findMany({
    where: { id: { in: itemIds }, organizationId: user.organizationId },
    select: { id: true },
  });
  if (orgItems.length !== itemIds.length) {
    return NextResponse.json({ error: "One or more items not found" }, { status: 404 });
  }

  const recordIds = counts.map((c) => c.recordId);
  const orgRecords = await prisma.inventoryRecord.findMany({
    where: { id: { in: recordIds }, item: { organizationId: user.organizationId } },
    select: { id: true },
  });
  if (orgRecords.length !== recordIds.length) {
    return NextResponse.json({ error: "One or more inventory records not found" }, { status: 404 });
  }

  const discrepancies = counts.filter((c) => c.physicalQty !== c.currentQty);
  if (discrepancies.length === 0) {
    return NextResponse.json({ adjustments: 0, message: "No discrepancies found" });
  }

  // Create adjustment movements and update inventory records in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const movements = [];

    for (const count of discrepancies) {
      const diff = count.physicalQty - count.currentQty;

      // Update inventory record
      await tx.inventoryRecord.update({
        where: { id: count.recordId },
        data: { quantity: count.physicalQty, lastUpdated: new Date() },
      });

      // Create ADJUSTMENT movement with the absolute diff
      const movement = await tx.stockMovement.create({
        data: {
          itemId: count.itemId,
          locationId,
          type: "ADJUSTMENT",
          quantity: Math.abs(diff),
          reference: `STOCKTAKE`,
          notes: notes
            ? `Stocktake: ${diff > 0 ? "+" : ""}${diff}. ${notes}`
            : `Stocktake adjustment: ${diff > 0 ? "+" : ""}${diff}`,
          userId: user.id,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          itemId: count.itemId,
          action: "UPDATE",
          entity: "InventoryRecord",
          entityId: count.recordId,
          changes: JSON.stringify({ stocktake: true, before: count.currentQty, after: count.physicalQty, diff }),
        },
      });

      movements.push(movement);
    }

    return movements;
  });

  return NextResponse.json({ adjustments: result.length, movements: result });
}
