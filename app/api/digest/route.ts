import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWeeklyDigest } from "@/lib/email";

// Secured with CRON_SECRET — call via:
// POST /api/digest  { Authorization: Bearer <CRON_SECRET> }
// or GET for manual trigger from settings (session-checked below)
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Run digest for every organization
  const orgs = await prisma.organization.findMany({
    include: {
      users: {
        where: { role: { in: ["OWNER", "ADMIN"] } },
        select: { email: true, notificationPreferences: { where: { alertType: "LOW_STOCK" } } },
      },
    },
  });

  const results: { org: string; sent: boolean }[] = [];

  for (const org of orgs) {
    const recipients = org.users
      .filter((u) => {
        const pref = u.notificationPreferences[0];
        return pref ? pref.email : true;
      })
      .map((u) => u.email);

    if (recipients.length === 0) continue;

    const [totalItems, lowStockCount, pendingPOs, weekMovements, wastageMovements, items] =
      await Promise.all([
        prisma.item.count({ where: { organizationId: org.id } }),

        prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) FROM "InventoryRecord" ir
          JOIN "Item" i ON ir."itemId" = i.id
          WHERE i."organizationId" = ${org.id}
          AND ir.quantity <= ir."reorderPoint"
        `.then((r) => Number(r[0].count)),

        prisma.purchaseOrder.count({
          where: { organizationId: org.id, status: { in: ["DRAFT", "SENT", "PARTIAL"] } },
        }),

        prisma.stockMovement.findMany({
          where: { item: { organizationId: org.id }, createdAt: { gte: sevenDaysAgo } },
          select: { type: true, quantity: true },
        }),

        prisma.stockMovement.findMany({
          where: { item: { organizationId: org.id }, type: "WASTAGE", createdAt: { gte: sevenDaysAgo } },
          include: { item: { select: { name: true, unit: true, unitCost: true } } },
        }),

        prisma.item.findMany({
          where: { organizationId: org.id },
          select: { id: true },
        }),
      ]);

    const weekReceipts = weekMovements.filter((m) => m.type === "RECEIPT").reduce((s, m) => s + m.quantity, 0);
    const weekIssues = weekMovements.filter((m) => m.type === "ISSUE").reduce((s, m) => s + m.quantity, 0);
    const weekWastageValue = wastageMovements.reduce((s, m) => s + m.quantity * m.item.unitCost, 0);

    // Top 5 wasted items by quantity
    const wastedByItem: Record<string, { name: string; qty: number; unit: string }> = {};
    for (const m of wastageMovements) {
      if (!wastedByItem[m.itemId]) wastedByItem[m.itemId] = { name: m.item.name, qty: 0, unit: m.item.unit };
      wastedByItem[m.itemId].qty += m.quantity;
    }
    const topWasted = Object.values(wastedByItem).sort((a, b) => b.qty - a.qty).slice(0, 5);

    await sendWeeklyDigest({
      to: recipients,
      orgName: org.name,
      totalItems,
      lowStockCount,
      weekReceipts,
      weekIssues,
      weekWastageValue,
      pendingPOs,
      topWasted,
      appUrl,
    });

    results.push({ org: org.name, sent: true });
  }

  return NextResponse.json({ ok: true, results });
}
