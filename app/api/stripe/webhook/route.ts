import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const orgId = (event.data.object as any).metadata?.organizationId as string | undefined;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subId = session.subscription as string;
      const resolvedOrgId = orgId ?? (await getOrgFromCustomer(session.customer as string));
      if (resolvedOrgId) {
        await prisma.organization.update({
          where: { id: resolvedOrgId },
          data: {
            plan: "PRO",
            planStatus: "TRIALING",
            stripeSubscriptionId: subId,
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const resolvedOrgId = orgId ?? (await getOrgFromCustomer(sub.customer as string));
      if (resolvedOrgId) {
        await prisma.organization.update({
          where: { id: resolvedOrgId },
          data: {
            plan: sub.status === "active" || sub.status === "trialing" ? "PRO" : "FREE",
            planStatus: mapStatus(sub.status),
            trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const resolvedOrgId = orgId ?? (await getOrgFromCustomer(sub.customer as string));
      if (resolvedOrgId) {
        await prisma.organization.update({
          where: { id: resolvedOrgId },
          data: { plan: "FREE", planStatus: "CANCELLED", stripeSubscriptionId: null },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const resolvedOrgId = await getOrgFromCustomer(invoice.customer as string);
      if (resolvedOrgId) {
        await prisma.organization.update({
          where: { id: resolvedOrgId },
          data: { planStatus: "PAST_DUE" },
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const resolvedOrgId = await getOrgFromCustomer(invoice.customer as string);
      if (resolvedOrgId) {
        await prisma.organization.update({
          where: { id: resolvedOrgId },
          data: { planStatus: "ACTIVE" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function getOrgFromCustomer(customerId: string): Promise<string | null> {
  const org = await prisma.organization.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return org?.id ?? null;
}

function mapStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "active": return "ACTIVE";
    case "trialing": return "TRIALING";
    case "past_due": return "PAST_DUE";
    case "canceled": return "CANCELLED";
    default: return "ACTIVE";
  }
}
