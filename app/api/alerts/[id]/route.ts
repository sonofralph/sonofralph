import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SessionUser } from "@/types";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["ACKNOWLEDGED", "RESOLVED"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;

  const alert = await prisma.alert.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const updated = await prisma.alert.update({
    where: { id },
    data: { status: parsed.data.status, updatedAt: new Date() },
  });

  return NextResponse.json(updated);
}
