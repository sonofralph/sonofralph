import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const rowSchema = z.object({
  name: z.string().min(1),
  contact: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const importSchema = z.object({
  rows: z.array(rowSchema).min(1).max(200),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { rows } = importSchema.parse(body);

    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      const existing = await prisma.supplier.findFirst({
        where: {
          organizationId: user.organizationId,
          name: { equals: row.name.trim(), mode: "insensitive" },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.supplier.create({
        data: {
          organizationId: user.organizationId,
          name: row.name.trim(),
          contact: row.contact?.trim() || null,
          email: row.email?.trim() || null,
          phone: row.phone?.trim() || null,
          address: row.address?.trim() || null,
        },
      });
      created++;
    }

    return NextResponse.json({ created, skipped });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
