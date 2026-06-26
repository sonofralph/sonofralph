import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SessionUser } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;

  const records = await prisma.inventoryRecord.findMany({
    where: { item: { organizationId: user.organizationId } },
    include: { item: { include: { category: true } }, location: true },
    orderBy: { item: { name: "asc" } },
  });

  const rows = [
    ["SKU", "Item Name", "Category", "Location", "Quantity", "Unit", "Min Stock", "Reorder Point", "Max Stock", "Status", "Last Updated"],
    ...records.map((r) => {
      const status = r.quantity <= r.minStock ? "Critical" : r.quantity <= r.reorderPoint ? "Low" : "OK";
      return [r.item.sku, r.item.name, r.item.category.name, r.location.name, r.quantity, r.item.unit, r.minStock, r.reorderPoint, r.maxStock, status, r.lastUpdated.toISOString()];
    }),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="inventory-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
