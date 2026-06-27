import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SessionUser } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;

  const recipes = await prisma.recipe.findMany({
    where: { organizationId: user.organizationId },
    include: {
      ingredients: {
        include: { item: { select: { name: true, sku: true, unit: true, unitCost: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  const rows: (string | number)[][] = [
    ["Recipe", "Category", "Servings", "Selling Price", "Target Cost %", "Ingredient", "Ingredient SKU", "Qty", "Unit", "Unit Cost", "Line Cost", "Total Recipe Cost", "Cost/Serving", "Actual Cost %", "Margin/Serving"],
  ];

  for (const recipe of recipes) {
    const totalCost = recipe.ingredients.reduce(
      (sum, ing) => sum + ing.quantity * ing.item.unitCost,
      0
    );
    const costPerServing = recipe.servings > 0 ? totalCost / recipe.servings : 0;
    const costPct = recipe.sellingPrice > 0 ? (costPerServing / recipe.sellingPrice) * 100 : 0;
    const margin = recipe.sellingPrice > 0 ? recipe.sellingPrice - costPerServing : 0;

    recipe.ingredients.forEach((ing, i) => {
      const lineCost = ing.quantity * ing.item.unitCost;
      rows.push([
        i === 0 ? recipe.name : "",
        i === 0 ? (recipe.category ?? "") : "",
        i === 0 ? recipe.servings : "",
        i === 0 ? recipe.sellingPrice : "",
        i === 0 ? recipe.targetCostPercent : "",
        ing.item.name,
        ing.item.sku,
        ing.quantity,
        ing.unit,
        ing.item.unitCost,
        lineCost,
        i === 0 ? totalCost.toFixed(2) : "",
        i === 0 ? costPerServing.toFixed(2) : "",
        i === 0 ? costPct.toFixed(1) : "",
        i === 0 ? margin.toFixed(2) : "",
      ]);
    });

    if (recipe.ingredients.length === 0) {
      rows.push([recipe.name, recipe.category ?? "", recipe.servings, recipe.sellingPrice, recipe.targetCostPercent, "", "", "", "", "", "", "0", "0", "0", "0"]);
    }
  }

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="recipes-food-cost-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
