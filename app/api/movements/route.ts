import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { SessionUser } from "@/types";
import { sendAlertEmail } from "@/lib/email";

const MOVEMENT_TYPES = ["RECEIPT", "ISSUE", "TRANSFER", "ADJUSTMENT", "WASTAGE"] as const;

const movementSchema = z.object({
  itemId: z.string().min(1),
  locationId: z.string().min(1),
  type: z.enum(MOVEMENT_TYPES),
  quantity: z.number().positive(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const skip = (page - 1) * limit;

  const movements = await prisma.stockMovement.findMany({
    where: { item: { organizationId: user.organizationId } },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: {
      item: { select: { name: true, sku: true, unit: true } },
      location: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(movements);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;

  try {
    const body = await req.json();
    const data = movementSchema.parse(body);

    // Verify item belongs to org
    const item = await prisma.item.findFirst({
      where: { id: data.itemId, organizationId: user.organizationId },
    });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Verify location belongs to org
    const location = await prisma.location.findFirst({
      where: { id: data.locationId, organizationId: user.organizationId },
    });
    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Run in a transaction: create movement + update inventory record
    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          itemId: data.itemId,
          locationId: data.locationId,
          type: data.type,
          quantity: data.quantity,
          reference: data.reference,
          notes: data.notes,
          userId: user.id!,
        },
      });

      // Determine quantity delta
      const isAdditive = data.type === "RECEIPT";
      const isDeductive =
        data.type === "ISSUE" || data.type === "WASTAGE";

      let quantityDelta = 0;
      if (isAdditive) quantityDelta = data.quantity;
      else if (isDeductive) quantityDelta = -data.quantity;
      // TRANSFER and ADJUSTMENT are handled as-is here (simplified)
      else quantityDelta = data.quantity; // ADJUSTMENT adds, caller controls sign via positive/negative

      // Upsert inventory record
      const record = await tx.inventoryRecord.upsert({
        where: {
          itemId_locationId: {
            itemId: data.itemId,
            locationId: data.locationId,
          },
        },
        create: {
          itemId: data.itemId,
          locationId: data.locationId,
          quantity: Math.max(0, quantityDelta),
          minStock: 0,
          maxStock: 1000,
          reorderPoint: 10,
          lastUpdated: new Date(),
        },
        update: {
          quantity: {
            increment: quantityDelta,
          },
          lastUpdated: new Date(),
        },
      });

      // Check if we need to generate an alert
      let newAlertType: "LOW_STOCK" | "OUT_OF_STOCK" | null = null;
      if (record.quantity <= record.reorderPoint) {
        const existingAlert = await tx.alert.findFirst({
          where: {
            itemId: data.itemId,
            locationId: data.locationId,
            status: { in: ["OPEN", "ACKNOWLEDGED"] },
          },
        });
        if (!existingAlert) {
          newAlertType = record.quantity <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK";
          await tx.alert.create({
            data: {
              organizationId: user.organizationId,
              itemId: data.itemId,
              locationId: data.locationId,
              type: newAlertType,
              status: "OPEN",
              message: `${item.name} is ${
                record.quantity <= 0 ? "out of stock" : "running low"
              } at ${location.name}. Current qty: ${record.quantity} ${item.unit}`,
            },
          });
        }
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          itemId: data.itemId,
          action: "CREATE",
          entity: "StockMovement",
          entityId: movement.id,
          changes: JSON.stringify({ type: data.type, quantity: data.quantity, locationId: data.locationId }),
        },
      });

      return { movement, newAlertType, currentQty: record.quantity };
    });

    // Send alert email outside transaction — failure must not affect the movement
    if (result.newAlertType) {
      const admins = await prisma.user.findMany({
        where: { organizationId: user.organizationId, role: { in: ["OWNER", "ADMIN"] } },
        select: { email: true },
      });
      const org = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { name: true },
      });
      sendAlertEmail({
        to: admins.map((u) => u.email),
        itemName: item.name,
        locationName: location.name,
        type: result.newAlertType,
        quantity: result.currentQty,
        unit: item.unit,
        orgName: org?.name ?? "Your organization",
      });
    }

    return NextResponse.json(result.movement, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? err.message },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
