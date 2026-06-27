import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";

const ALERT_TYPES = ["LOW_STOCK", "OUT_OF_STOCK", "EXPIRY"] as const;

const schema = z.object({
  alertType: z.enum(ALERT_TYPES),
  email: z.boolean(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: user.id },
  });

  // Return all types with defaults for missing prefs
  const result = ALERT_TYPES.map((type) => ({
    alertType: type,
    email: prefs.find((p) => p.alertType === type)?.email ?? true,
  }));

  return NextResponse.json(result);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { alertType, email } = parsed.data;

  await prisma.notificationPreference.upsert({
    where: { userId_alertType: { userId: user.id, alertType } },
    create: { userId: user.id, alertType, email },
    update: { email },
  });

  return NextResponse.json({ ok: true });
}
