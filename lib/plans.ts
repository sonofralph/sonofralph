export type Plan = "FREE" | "PRO" | "ENTERPRISE";
export type PlanStatus = "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED";

export const PLAN_LIMITS = {
  FREE: {
    locations: 1,
    users: 3,
    items: 50,
    label: "Free",
    price: 0,
  },
  PRO: {
    locations: 5,
    users: 20,
    items: Infinity,
    label: "Pro",
    price: 49,
  },
  ENTERPRISE: {
    locations: Infinity,
    users: Infinity,
    items: Infinity,
    label: "Enterprise",
    price: null,
  },
} as const;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[(plan as Plan) ?? "FREE"] ?? PLAN_LIMITS.FREE;
}

export function isActive(planStatus: string) {
  return planStatus === "ACTIVE" || planStatus === "TRIALING";
}
