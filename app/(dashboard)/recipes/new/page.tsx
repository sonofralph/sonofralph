import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { NewRecipeForm } from "./NewRecipeForm";

export default async function NewRecipePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) redirect("/recipes");

  const items = await prisma.item.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, unit: true, unitCost: true, sku: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Recipe</h1>
        <p className="text-sm text-slate-500">Define ingredients and track food cost automatically</p>
      </div>
      <NewRecipeForm items={items} />
    </div>
  );
}
