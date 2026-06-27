import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const createSchema = z.object({
  locationId: z.string(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().positive(),
    notes: z.string().optional(),
  })).min(1),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as SessionUser;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: any = { organizationId: user.organizationId };
  if (status) where.status = status;
  // STAFF only see their own requisitions
  if (user.role === "STAFF") where.requestedById = user.id;

  const requisitions = await prisma.requisition.findMany({
    where,
    include: {
      requestedBy: { select: { id: true, name: true, email: true, jobTitle: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
      location: { select: { id: true, name: true } },
      lines: { include: { item: { select: { id: true, name: true, unit: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requisitions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as SessionUser;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { locationId, notes, lines } = parsed.data;

  const requisition = await prisma.requisition.create({
    data: {
      organizationId: user.organizationId,
      requestedById: user.id,
      locationId,
      notes,
      lines: { create: lines },
    },
    include: {
      lines: { include: { item: true } },
      location: true,
      requestedBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(requisition, { status: 201 });
}
