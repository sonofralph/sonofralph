import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as SessionUser;

  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const requisition = await prisma.requisition.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!requisition) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (requisition.status !== "PENDING") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
  }

  const updated = await prisma.requisition.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewedById: user.id,
      reviewNote: parsed.data.reviewNote,
    },
    include: {
      lines: { include: { item: true } },
      location: true,
      requestedBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}
