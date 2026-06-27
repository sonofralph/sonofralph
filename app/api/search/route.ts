import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json({ items: [], suppliers: [], purchaseOrders: [] });

  const orgId = user.organizationId;

  const [items, suppliers, purchaseOrders] = await Promise.all([
    prisma.item.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, sku: true, unit: true },
      take: 5,
    }),

    prisma.supplier.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { contact: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, contact: true },
      take: 5,
    }),

    prisma.purchaseOrder.findMany({
      where: {
        organizationId: orgId,
        supplier: { name: { contains: q, mode: "insensitive" } },
      },
      select: { id: true, status: true, supplier: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({ items, suppliers, purchaseOrders });
}
