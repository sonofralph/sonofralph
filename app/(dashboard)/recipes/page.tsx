import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Plus, ChefHat, TrendingUp, DollarSign, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function RecipesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

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

  const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recipes & Food Cost</h1>
          <p className="text-sm text-slate-500">{recipes.length} recipes · Track ingredient costs and margins</p>
        </div>
        {canManage && (
          <Link href="/recipes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Recipe
            </Button>
          </Link>
        )}
      </div>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <ChefHat className="h-7 w-7 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">No recipes yet</p>
            <p className="text-sm text-slate-400">Add your first recipe to start tracking food costs</p>
          </div>
          {canManage && (
            <Link href="/recipes/new">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />Add Recipe
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recipes.map((recipe) => {
            const totalCost = recipe.ingredients.reduce(
              (sum, ing) => sum + ing.quantity * ing.item.unitCost,
              0
            );
            const costPerServing = totalCost / recipe.servings;
            const costPercent = recipe.sellingPrice > 0
              ? (costPerServing / recipe.sellingPrice) * 100
              : null;
            const margin = recipe.sellingPrice > 0
              ? recipe.sellingPrice - costPerServing
              : null;

            const costStatus =
              costPercent === null ? "unknown" :
              costPercent <= recipe.targetCostPercent ? "good" :
              costPercent <= recipe.targetCostPercent * 1.2 ? "warning" : "over";

            return (
              <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{recipe.name}</CardTitle>
                      {recipe.category && (
                        <span className="text-xs text-slate-400">{recipe.category}</span>
                      )}
                    </div>
                    <Badge
                      className={cn(
                        "shrink-0 text-xs",
                        costStatus === "good" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                        costStatus === "warning" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                        costStatus === "over" ? "bg-red-100 text-red-700 hover:bg-red-100" :
                        "bg-slate-100 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {costStatus === "good" ? "On target" :
                       costStatus === "warning" ? "Near limit" :
                       costStatus === "over" ? "Over budget" : "No price set"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cost metrics */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-slate-50 p-2.5 text-center">
                      <DollarSign className="mx-auto h-3.5 w-3.5 text-slate-400 mb-1" />
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(costPerServing)}</p>
                      <p className="text-[10px] text-slate-400">Cost/serving</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5 text-center">
                      <Percent className="mx-auto h-3.5 w-3.5 text-slate-400 mb-1" />
                      <p className={cn("text-sm font-bold", costStatus === "good" ? "text-emerald-600" : costStatus === "over" ? "text-red-600" : "text-slate-900")}>
                        {costPercent !== null ? `${costPercent.toFixed(1)}%` : "—"}
                      </p>
                      <p className="text-[10px] text-slate-400">Food cost %</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5 text-center">
                      <TrendingUp className="mx-auto h-3.5 w-3.5 text-slate-400 mb-1" />
                      <p className="text-sm font-bold text-slate-900">
                        {margin !== null ? formatCurrency(margin) : "—"}
                      </p>
                      <p className="text-[10px] text-slate-400">Margin</p>
                    </div>
                  </div>

                  {/* Cost bar */}
                  {costPercent !== null && (
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Food cost</span>
                        <span>Target: {recipe.targetCostPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className={cn("h-1.5 rounded-full transition-all", costStatus === "good" ? "bg-emerald-500" : costStatus === "warning" ? "bg-amber-500" : "bg-red-500")}
                          style={{ width: `${Math.min(costPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Ingredients */}
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Ingredients ({recipe.ingredients.length})</p>
                    <div className="space-y-1">
                      {recipe.ingredients.slice(0, 3).map((ing) => (
                        <div key={ing.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 truncate">{ing.item.name}</span>
                          <span className="text-slate-400 shrink-0 ml-2">{ing.quantity} {ing.unit} · {formatCurrency(ing.quantity * ing.item.unitCost)}</span>
                        </div>
                      ))}
                      {recipe.ingredients.length > 3 && (
                        <p className="text-xs text-slate-400">+{recipe.ingredients.length - 3} more</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-400">{recipe.servings} serving{recipe.servings !== 1 ? "s" : ""} · Total: {formatCurrency(totalCost)}</span>
                    {recipe.sellingPrice > 0 && (
                      <span className="text-xs font-medium text-slate-600">Sell: {formatCurrency(recipe.sellingPrice)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
