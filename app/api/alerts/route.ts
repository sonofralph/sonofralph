import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const alerts = await prisma.alert.findMany({
    where: {
      organizationId: user.organizationId,
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      item: { select: { name: true, sku: true, unit: true } },
      location: { select: { name: true } },
    },
  });

  return NextResponse.json(alerts);
}
