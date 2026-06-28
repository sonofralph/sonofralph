import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const VALID_TYPES = ["RESTAURANT", "HOTEL", "BAR", "CAFE", "CATERING", "CLINIC"] as const;

const schema = z.object({
  businessType: z.enum(VALID_TYPES),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as SessionUser;

  if (!["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid business type" }, { status: 400 });

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { businessType: parsed.data.businessType },
  });

  return NextResponse.json({ ok: true });
}
