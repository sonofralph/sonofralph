import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const ingredientSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  servings: z.number().positive().optional(),
  sellingPrice: z.number().min(0).optional(),
  targetCostPercent: z.number().min(0).max(100).optional(),
  ingredients: z.array(ingredientSchema).min(1).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  const { id } = await params;

  const recipe = await prisma.recipe.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      ingredients: {
        include: { item: { select: { id: true, name: true, unitCost: true, unit: true, sku: true } } },
      },
    },
  });

  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(recipe);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.recipe.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { ingredients, ...data } = parsed.data;

  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      ...data,
      ...(ingredients && {
        ingredients: {
          deleteMany: {},
          create: ingredients,
        },
      }),
    },
    include: {
      ingredients: {
        include: { item: { select: { id: true, name: true, unitCost: true, unit: true, sku: true } } },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      action: "UPDATE",
      entity: "Recipe",
      entityId: recipe.id,
      changes: JSON.stringify({ name: recipe.name }),
    },
  });

  return NextResponse.json(recipe);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.recipe.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
