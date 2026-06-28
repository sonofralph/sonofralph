import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const orgId = user.organizationId;

  const [
    org,
    users,
    locations,
    departments,
    categories,
    items,
    inventoryRecords,
    movements,
    suppliers,
    purchaseOrders,
    recipes,
    alerts,
    requisitions,
    handovers,
    auditLogs,
  ] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true, name: true, slug: true, plan: true, planStatus: true,
        deploymentMode: true, businessType: true, createdAt: true,
      },
    }),
    prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true, email: true, name: true, jobTitle: true, role: true, createdAt: true,
      },
    }),
    prisma.location.findMany({ where: { organizationId: orgId } }),
    prisma.department.findMany({ where: { organizationId: orgId } }),
    prisma.category.findMany({ where: { organizationId: orgId } }),
    prisma.item.findMany({
      where: { organizationId: orgId },
      select: {
        id: true, name: true, sku: true, description: true, unit: true,
        unitCost: true, expiryDays: true, trackingType: true, categoryId: true, createdAt: true,
      },
    }),
    prisma.inventoryRecord.findMany({
      where: { item: { organizationId: orgId } },
    }),
    prisma.stockMovement.findMany({
      where: { item: { organizationId: orgId } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplier.findMany({ where: { organizationId: orgId } }),
    prisma.purchaseOrder.findMany({
      where: { organizationId: orgId },
      include: { lines: true },
    }),
    prisma.recipe.findMany({
      where: { organizationId: orgId },
      include: { ingredients: true },
    }),
    prisma.alert.findMany({ where: { organizationId: orgId } }),
    prisma.requisition.findMany({
      where: { organizationId: orgId },
      include: { lines: true },
    }),
    prisma.shiftHandover.findMany({ where: { organizationId: orgId } }),
    prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    organization: org,
    users,
    departments,
    locations,
    categories,
    items,
    inventoryRecords,
    stockMovements: movements,
    suppliers,
    purchaseOrders,
    recipes,
    alerts,
    requisitions,
    shiftHandovers: handovers,
    auditLogs,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="mise-export-${org?.slug ?? orgId}-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
