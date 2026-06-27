import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SessionUser } from "@/types";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1).max(100) });

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid name" }, { status: 400 });

  const org = await prisma.organization.update({
    where: { id: user.organizationId },
    data: { name: parsed.data.name },
    select: { id: true, name: true },
  });

  return NextResponse.json(org);
}
