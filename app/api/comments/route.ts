import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const VALID_ENTITY_TYPES = ["PURCHASE_ORDER", "REQUISITION"] as const;

const postSchema = z.object({
  entityType: z.enum(VALID_ENTITY_TYPES),
  entityId: z.string().min(1),
  body: z.string().min(1).max(2000),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as SessionUser;

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  if (
    !entityType ||
    !(VALID_ENTITY_TYPES as readonly string[]).includes(entityType) ||
    !entityId
  ) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { organizationId: user.organizationId, entityType, entityId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(comments);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as SessionUser;

  try {
    const body = await req.json();
    const data = postSchema.parse(body);

    const comment = await prisma.comment.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        entityType: data.entityType,
        entityId: data.entityId,
        body: data.body,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(comment, { status: 201 });
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
