import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SessionUser } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;

  const orders = await prisma.purchaseOrder.findMany({
    where: { organizationId: user.organizationId },
    include: {
      supplier: { select: { name: true } },
      lines: {
        include: { item: { select: { name: true, sku: true, unit: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: (string | number)[][] = [
    ["PO Date", "Supplier", "Status", "SKU", "Item", "Qty Ordered", "Qty Received", "Unit", "Unit Cost", "Line Total", "PO Total", "Notes"],
  ];

  for (const po of orders) {
    if (po.lines.length === 0) {
      rows.push([
        po.orderDate.toISOString().split("T")[0],
        po.supplier.name,
        po.status,
        "", "", "", "", "", "", "",
        po.totalAmount,
        po.notes ?? "",
      ]);
    } else {
      po.lines.forEach((line, i) => {
        rows.push([
          i === 0 ? po.orderDate.toISOString().split("T")[0] : "",
          i === 0 ? po.supplier.name : "",
          i === 0 ? po.status : "",
          line.item.sku,
          line.item.name,
          line.quantity,
          line.receivedQty,
          line.item.unit,
          line.unitCost,
          line.quantity * line.unitCost,
          i === 0 ? po.totalAmount : "",
          i === 0 ? (po.notes ?? "") : "",
        ]);
      });
    }
  }

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="purchase-orders-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
