import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SessionUser } from "@/types";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "stripe/portal", { limit: 20, windowSecs: 3600 });
  if (limited) return limited;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { stripeCustomerId: true },
  });

  if (!org?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/settings/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
