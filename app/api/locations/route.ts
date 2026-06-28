import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";
import { checkPlanLimit } from "@/lib/plan-gate";

const LOCATION_TYPES = ["HOTEL", "RESTAURANT", "BAR", "KITCHEN", "WAREHOUSE", "EVENT_SPACE"] as const;

const locationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(LOCATION_TYPES),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;

  const locations = await prisma.location.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(locations);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;

  if (!["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limitHit = await checkPlanLimit(user.organizationId, "locations");
  if (limitHit) return limitHit;

  try {
    const body = await req.json();
    const data = locationSchema.parse(body);

    const location = await prisma.location.create({
      data: {
        ...data,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? err.message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
