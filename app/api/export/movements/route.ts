import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SessionUser } from "@/types";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type");

  const where: Record<string, unknown> = { item: { organizationId: user.organizationId } };
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to + "T23:59:59Z") } : {}),
    };
  }
  if (type) where.type = type;

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      item: { select: { name: true, sku: true } },
      location: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = [
    ["Date", "SKU", "Item", "Type", "Quantity", "Location", "Reference", "Notes", "Performed By"],
    ...movements.map((m) => [
      m.createdAt.toISOString(),
      m.item.sku,
      m.item.name,
      m.type,
      m.quantity,
      m.location.name,
      m.reference ?? "",
      m.notes ?? "",
      m.user.name ?? m.user.email,
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="movements-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
