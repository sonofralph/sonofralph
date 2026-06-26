import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const poLineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().positive(),
  unitCost: z.number().min(0),
});

const poSchema = z.object({
  supplierId: z.string().min(1),
  expectedDate: z.string().nullable().optional(),
  notes: z.string().optional(),
  lines: z.array(poLineSchema).min(1, "At least one line is required"),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;

  const orders = await prisma.purchaseOrder.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      supplier: true,
      lines: { include: { item: true } },
    },
  });

  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;

  if (!["OWNER", "ADMIN", "MANAGER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = poSchema.parse(body);

    const totalAmount = data.lines.reduce(
      (s, l) => s + l.quantity * l.unitCost,
      0
    );

    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId: data.supplierId,
        organizationId: user.organizationId,
        status: "DRAFT",
        totalAmount,
        notes: data.notes,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        lines: {
          create: data.lines.map((l) => ({
            itemId: l.itemId,
            quantity: l.quantity,
            unitCost: l.unitCost,
            receivedQty: 0,
          })),
        },
      },
      include: {
        supplier: true,
        lines: { include: { item: true } },
      },
    });

    return NextResponse.json(po, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? err.message },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
