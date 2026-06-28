import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  description: z.string().optional(),
  unit: z.string().min(1).optional(),
  unitCost: z.number().min(0).optional(),
  expiryDays: z.number().int().positive().nullable().optional(),
  categoryId: z.string().min(1).optional(),
  trackingType: z.enum(["CONSUMABLE", "REUSABLE", "ASSET"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { itemId } = await params;

  const existing = await prisma.item.findFirst({
    where: { id: itemId, organizationId: user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Check SKU uniqueness if changing
  if (parsed.data.sku && parsed.data.sku !== existing.sku) {
    const conflict = await prisma.item.findFirst({
      where: { organizationId: user.organizationId, sku: parsed.data.sku, id: { not: itemId } },
    });
    if (conflict) return NextResponse.json({ error: "SKU already in use" }, { status: 409 });
  }

  const item = await prisma.item.update({
    where: { id: itemId },
    data: parsed.data,
    include: { category: true },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      itemId,
      action: "UPDATE",
      entity: "Item",
      entityId: itemId,
      changes: JSON.stringify(parsed.data),
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { itemId } = await params;

  const existing = await prisma.item.findFirst({
    where: { id: itemId, organizationId: user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.item.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}
