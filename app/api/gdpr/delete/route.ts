import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SessionUser } from "@/types";
import { z } from "zod";

const schema = z.object({ confirmation: z.string() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "confirmation is required" }, { status: 400 });

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { id: true, name: true, slug: true, stripeSubscriptionId: true },
  });

  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  if (parsed.data.confirmation !== org.name) {
    return NextResponse.json({ error: "Confirmation does not match organization name" }, { status: 422 });
  }

  // Cancel Stripe subscription before deletion so no further charges occur
  if (org.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(org.stripeSubscriptionId);
    } catch {
      // Non-fatal — proceed with deletion even if Stripe call fails
      console.error("[gdpr/delete] Failed to cancel Stripe subscription");
    }
  }

  // Cascade deletes everything: users, items, movements, audit logs, etc.
  await prisma.organization.delete({ where: { id: org.id } });

  return NextResponse.json({ ok: true });
}
