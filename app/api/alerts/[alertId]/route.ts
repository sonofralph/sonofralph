import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";
import { AlertStatus } from "@prisma/client";

const patchSchema = z.object({
  status: z.nativeEnum(AlertStatus),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ alertId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  const { alertId } = await params;

  try {
    const body = await req.json();
    const { status } = patchSchema.parse(body);

    const alert = await prisma.alert.findFirst({
      where: { id: alertId, organizationId: user.organizationId },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: { status },
    });

    return NextResponse.json(updated);
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
