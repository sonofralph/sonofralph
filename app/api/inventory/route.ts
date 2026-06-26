import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const categoryId = searchParams.get("categoryId");
  const locationId = searchParams.get("locationId");

  const records = await prisma.inventoryRecord.findMany({
    where: {
      item: {
        organizationId: user.organizationId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      ...(locationId ? { locationId } : {}),
    },
    include: {
      item: { include: { category: true } },
      location: true,
    },
    orderBy: { item: { name: "asc" } },
  });

  return NextResponse.json(records);
}

const itemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().min(1),
  categoryId: z.string().min(1),
  locationId: z.string().min(1),
  quantity: z.number().default(0),
  minStock: z.number().default(0),
  maxStock: z.number().default(100),
  reorderPoint: z.number().default(10),
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
    const data = itemSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          name: data.name,
          sku: data.sku,
          description: data.description,
          unit: data.unit,
          organizationId: user.organizationId,
          categoryId: data.categoryId,
        },
      });

      await tx.inventoryRecord.create({
        data: {
          itemId: item.id,
          locationId: data.locationId,
          quantity: data.quantity,
          minStock: data.minStock,
          maxStock: data.maxStock,
          reorderPoint: data.reorderPoint,
        },
      });

      return item;
    });

    return NextResponse.json(result, { status: 201 });
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
