import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SessionUser } from "@/types";
import { z } from "zod";

const patchSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MANAGER", "STAFF"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actor = session.user as SessionUser;
  if (!["OWNER", "ADMIN"].includes(actor.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const target = await prisma.user.findFirst({ where: { id, organizationId: actor.organizationId } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === actor.id) return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  if (target.role === "OWNER") return NextResponse.json({ error: "Cannot change owner role" }, { status: 400 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const newRole = actor.role !== "OWNER" && parsed.data.role === "OWNER" ? "ADMIN" : parsed.data.role;

  const updated = await prisma.user.update({
    where: { id },
    data: { role: newRole },
    select: { id: true, name: true, role: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actor = session.user as SessionUser;
  if (!["OWNER", "ADMIN"].includes(actor.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const target = await prisma.user.findFirst({ where: { id, organizationId: actor.organizationId } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === actor.id) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  if (target.role === "OWNER") return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 });

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
