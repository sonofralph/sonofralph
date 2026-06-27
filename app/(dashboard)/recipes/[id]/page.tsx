import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { SessionUser } from "@/types";
import { EditRecipeForm } from "./EditRecipeForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const { id } = await params;

  const [recipe, items] = await Promise.all([
    prisma.recipe.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        ingredients: {
          include: {
            item: { select: { id: true, name: true, unitCost: true, unit: true, sku: true } },
          },
        },
      },
    }),
    prisma.item.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true, unitCost: true, sku: true },
    }),
  ]);

  if (!recipe) notFound();

  const canEdit = ["OWNER", "ADMIN", "MANAGER"].includes(user.role);

  const defaultValues = {
    name: recipe.name,
    description: recipe.description ?? "",
    category: recipe.category ?? "",
    servings: recipe.servings,
    sellingPrice: recipe.sellingPrice,
    targetCostPercent: recipe.targetCostPercent,
    ingredients: recipe.ingredients.map((ing) => ({
      itemId: ing.item.id,
      quantity: ing.quantity,
      unit: ing.unit,
    })),
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/recipes" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="h-4 w-4" />
          Recipes
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{recipe.name}</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {recipe.category && <span>{recipe.category} · </span>}
          {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""} · {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? "s" : ""}
        </p>
      </div>

      <EditRecipeForm
        recipeId={id}
        defaultValues={defaultValues}
        items={items}
        canEdit={canEdit}
      />
    </div>
  );
}
