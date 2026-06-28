import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;

  const departments = await prisma.department.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: "asc" },
    include: {
      locations: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, type: true },
      },
      _count: { select: { locations: true } },
    },
  });

  return NextResponse.json(departments);
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const existing = await prisma.department.findFirst({
    where: { organizationId: user.organizationId, name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (existing) return NextResponse.json({ error: "A department with that name already exists" }, { status: 409 });

  const department = await prisma.department.create({
    data: {
      name: parsed.data.name,
      organizationId: user.organizationId,
    },
    include: {
      locations: { select: { id: true, name: true, type: true } },
      _count: { select: { locations: true } },
    },
  });

  return NextResponse.json(department, { status: 201 });
}
