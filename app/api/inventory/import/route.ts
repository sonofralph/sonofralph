import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const rowSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  unit: z.string().min(1),
  category: z.string().min(1),
  unitCost: z.coerce.number().min(0).default(0),
  description: z.string().optional(),
});

const importSchema = z.object({
  rows: z.array(rowSchema).min(1).max(500),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;

  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { rows } = importSchema.parse(body);

    // Resolve or create categories
    const categoryNames = [...new Set(rows.map((r) => r.category.trim()))];
    const categoryMap: Record<string, string> = {};

    for (const name of categoryNames) {
      const existing = await prisma.category.findFirst({
        where: { organizationId: user.organizationId, name: { equals: name, mode: "insensitive" } },
      });
      if (existing) {
        categoryMap[name.toLowerCase()] = existing.id;
      } else {
        const created = await prisma.category.create({
          data: { organizationId: user.organizationId, name },
        });
        categoryMap[name.toLowerCase()] = created.id;
      }
    }

    // Upsert items by SKU
    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const categoryId = categoryMap[row.category.trim().toLowerCase()];
      const existing = await prisma.item.findFirst({
        where: { organizationId: user.organizationId, sku: row.sku.trim() },
      });

      if (existing) {
        await prisma.item.update({
          where: { id: existing.id },
          data: {
            name: row.name.trim(),
            unit: row.unit.trim(),
            unitCost: row.unitCost,
            description: row.description?.trim() || null,
            categoryId,
          },
        });
        updated++;
      } else {
        await prisma.item.create({
          data: {
            organizationId: user.organizationId,
            name: row.name.trim(),
            sku: row.sku.trim(),
            unit: row.unit.trim(),
            unitCost: row.unitCost,
            description: row.description?.trim() || null,
            categoryId,
          },
        });
        created++;
      }
    }

    return NextResponse.json({ created, updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
