import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SessionUser } from "@/types";
import { z } from "zod";

const ingredientSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

const recipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  servings: z.number().positive().default(1),
  sellingPrice: z.number().min(0).default(0),
  targetCostPercent: z.number().min(0).max(100).default(30),
  ingredients: z.array(ingredientSchema).min(1),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;

  const recipes = await prisma.recipe.findMany({
    where: { organizationId: user.organizationId },
    include: {
      ingredients: {
        include: { item: { select: { name: true, unitCost: true, unit: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(recipes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = recipeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { ingredients, ...data } = parsed.data;

  const recipe = await prisma.recipe.create({
    data: {
      ...data,
      organizationId: user.organizationId,
      ingredients: {
        create: ingredients,
      },
    },
    include: {
      ingredients: {
        include: { item: { select: { name: true, unitCost: true, unit: true } } },
      },
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      action: "CREATE",
      entity: "Recipe",
      entityId: recipe.id,
      changes: JSON.stringify({ name: recipe.name }),
    },
  });

  return NextResponse.json(recipe, { status: 201 });
}
