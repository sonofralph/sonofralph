import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanLimits, isActive } from "@/lib/plans";

export type GatedResource = "locations" | "users" | "items";

export async function checkPlanLimit(
  organizationId: string,
  resource: GatedResource,
  adding = 1,
  userRole?: string
): Promise<NextResponse | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true, planStatus: true },
  });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const effectivePlan = isActive(org.planStatus) ? org.plan : "FREE";
  const limits = getPlanLimits(effectivePlan);
  const limit = limits[resource];
  if (limit === Infinity) return null;

  let current: number;
  if (resource === "locations") {
    current = await prisma.location.count({ where: { organizationId } });
  } else if (resource === "users") {
    current = await prisma.user.count({ where: { organizationId } });
  } else {
    current = await prisma.item.count({ where: { organizationId } });
  }

  if (current + adding > limit) {
    return NextResponse.json(
      { error: "PLAN_LIMIT_REACHED", resource, current, limit, currentPlan: effectivePlan, userRole, upgradeRequired: true },
      { status: 402 }
    );
  }
  return null;
}
