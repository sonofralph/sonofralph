import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { SessionUser } from "@/types";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { stripeCustomerId: true, name: true },
  });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      email: user.email,
      metadata: { organizationId: user.organizationId },
    });
    customerId = customer.id;
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: STRIPE_PRICES.PRO_MONTHLY, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { organizationId: user.organizationId },
    },
    success_url: `${process.env.NEXTAUTH_URL}/settings/billing?success=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/settings/billing?cancelled=1`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
