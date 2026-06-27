import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const schema = z.object({
  updates: z.array(z.object({
    recordId: z.string().min(1),
    parLevel: z.number().min(0),   // maxStock = par/target
    reorderPoint: z.number().min(0),
    minStock: z.number().min(0),
  })).min(1),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  // Verify all records belong to this org
  const recordIds = parsed.data.updates.map((u) => u.recordId);
  const records = await prisma.inventoryRecord.findMany({
    where: { id: { in: recordIds }, item: { organizationId: user.organizationId } },
    select: { id: true },
  });
  if (records.length !== recordIds.length) {
    return NextResponse.json({ error: "One or more records not found" }, { status: 404 });
  }

  await prisma.$transaction(
    parsed.data.updates.map(({ recordId, parLevel, reorderPoint, minStock }) =>
      prisma.inventoryRecord.update({
        where: { id: recordId },
        data: { maxStock: parLevel, reorderPoint, minStock },
      })
    )
  );

  return NextResponse.json({ updated: parsed.data.updates.length });
}
