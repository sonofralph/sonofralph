import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const createSchema = z.object({
  locationId: z.string(),
  notes: z.string().min(1).max(2000),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as SessionUser;

  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");

  const handovers = await prisma.shiftHandover.findMany({
    where: {
      organizationId: user.organizationId,
      ...(locationId ? { locationId } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, jobTitle: true } },
      location: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(handovers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as SessionUser;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const handover = await prisma.shiftHandover.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      locationId: parsed.data.locationId,
      notes: parsed.data.notes,
    },
    include: {
      user: { select: { name: true, email: true, jobTitle: true } },
      location: { select: { name: true } },
    },
  });

  return NextResponse.json(handover, { status: 201 });
}
