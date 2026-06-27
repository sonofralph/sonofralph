import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const schema = z.object({
  locations: z.array(z.object({
    name: z.string().min(1),
    type: z.string().min(1),
  })).min(1).max(20),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const created = await prisma.location.createMany({
    data: parsed.data.locations.map((l) => ({
      organizationId: user.organizationId,
      name: l.name.trim(),
      type: l.type,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ created: created.count });
}
