import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/types";
import { z } from "zod";
import bcrypt from "bcryptjs";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  jobTitle: z.string().max(100).nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });

  const { name, jobTitle, currentPassword, newPassword } = parsed.data;

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required to set a new password" }, { status: 400 });
    }
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
    if (!dbUser?.passwordHash) return NextResponse.json({ error: "Cannot change password for this account" }, { status: 400 });

    const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const updateData: Record<string, string | null> = {};
  if (name) updateData.name = name;
  if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
  if (newPassword) updateData.passwordHash = await bcrypt.hash(newPassword, 12);

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: { id: true, name: true, jobTitle: true, email: true, role: true },
  });

  return NextResponse.json(updated);
}
