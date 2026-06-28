import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const schema = z.object({
  locationId: z.string().min(1),
  counts: z.array(
    z.object({
      itemId: z.string().min(1),
      quantity: z.number().min(0),
    })
  ),
  markLive: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { locationId, counts, markLive } = parsed.data;
  const nonZero = counts.filter((c) => c.quantity > 0);

  const location = await prisma.location.findFirst({
    where: { id: locationId, organizationId: user.organizationId },
  });
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  if (nonZero.length > 0) {
    const itemIds = nonZero.map((c) => c.itemId);
    const orgItems = await prisma.item.findMany({
      where: { id: { in: itemIds }, organizationId: user.organizationId },
      select: { id: true },
    });
    if (orgItems.length !== itemIds.length) {
      return NextResponse.json({ error: "One or more items not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      for (const count of nonZero) {
        await tx.inventoryRecord.upsert({
          where: { itemId_locationId: { itemId: count.itemId, locationId } },
          create: {
            itemId: count.itemId,
            locationId,
            quantity: count.quantity,
            minStock: 0,
            maxStock: count.quantity * 2,
            reorderPoint: 0,
            lastUpdated: new Date(),
          },
          update: {
            quantity: count.quantity,
            lastUpdated: new Date(),
          },
        });

        await tx.stockMovement.create({
          data: {
            itemId: count.itemId,
            locationId,
            type: "ADJUSTMENT",
            quantity: count.quantity,
            reference: "OPENING_STOCK",
            notes: "Opening stock entry at go-live",
            userId: user.id,
          },
        });
      }

      if (markLive) {
        await tx.organization.update({
          where: { id: user.organizationId },
          data: { goLiveAt: new Date() },
        });
      }
    });
  } else if (markLive) {
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: { goLiveAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true, saved: nonZero.length });
}
