import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { sendAlertEmail } from "@/lib/email";

// Days ahead to warn about expiry
const WARN_DAYS = 3;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = user.organizationId;
  const now = new Date();
  const warnBefore = new Date(now.getTime() + WARN_DAYS * 24 * 60 * 60 * 1000);

  // Find RECEIPT movements with expiryDate within warning window, with stock still present
  const expiringMovements = await prisma.stockMovement.findMany({
    where: {
      type: "RECEIPT",
      expiryDate: { gte: now, lte: warnBefore },
      item: { organizationId: orgId },
    },
    include: {
      item: { select: { id: true, name: true, unit: true } },
      location: { select: { id: true, name: true } },
    },
  });

  let created = 0;

  for (const movement of expiringMovements) {
    // Check if an open EXPIRY alert already exists for this item+location
    const existing = await prisma.alert.findFirst({
      where: {
        organizationId: orgId,
        itemId: movement.itemId,
        locationId: movement.locationId,
        type: "EXPIRY",
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
    });

    if (!existing) {
      const daysLeft = Math.ceil(
        (movement.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      await prisma.alert.create({
        data: {
          organizationId: orgId,
          itemId: movement.itemId,
          locationId: movement.locationId,
          type: "EXPIRY",
          status: "OPEN",
          message: `${movement.item.name} at ${movement.location.name} expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Qty received: ${movement.quantity} ${movement.item.unit}.`,
        },
      });
      created++;

      // Email notification
      const admins = await prisma.user.findMany({
        where: { organizationId: orgId, role: { in: ["OWNER", "ADMIN"] } },
        select: { email: true },
      });
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true },
      });

      sendAlertEmail({
        to: admins.map((u) => u.email),
        itemName: movement.item.name,
        locationName: movement.location.name,
        type: "OUT_OF_STOCK", // reuse closest visual — EXPIRY not in union yet
        quantity: movement.quantity,
        unit: movement.item.unit,
        orgName: org?.name ?? "Your organization",
      });
    }
  }

  return NextResponse.json({ checked: expiringMovements.length, created });
}
