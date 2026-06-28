import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  locationIds: z.array(z.string()).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const dept = await prisma.department.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!dept) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { name, locationIds } = parsed.data;

  if (name && name !== dept.name) {
    const conflict = await prisma.department.findFirst({
      where: { organizationId: user.organizationId, name: { equals: name, mode: "insensitive" }, id: { not: id } },
    });
    if (conflict) return NextResponse.json({ error: "A department with that name already exists" }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    if (name) {
      await tx.department.update({ where: { id }, data: { name } });
    }

    if (locationIds !== undefined) {
      // Remove all current assignments for this dept, then set new ones
      await tx.location.updateMany({
        where: { departmentId: id, organizationId: user.organizationId },
        data: { departmentId: null },
      });
      if (locationIds.length > 0) {
        await tx.location.updateMany({
          where: { id: { in: locationIds }, organizationId: user.organizationId },
          data: { departmentId: id },
        });
      }
    }
  });

  const updated = await prisma.department.findUnique({
    where: { id },
    include: {
      locations: { orderBy: { name: "asc" }, select: { id: true, name: true, type: true } },
      _count: { select: { locations: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const dept = await prisma.department.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!dept) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Locations get departmentId = null via ON DELETE SET NULL
  await prisma.department.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
