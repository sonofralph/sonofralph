import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPageClient from "@/components/landing/LandingPageClient";
import { prisma } from "@/lib/prisma";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/inventory");

  const orgs = await prisma.organization.findMany({
    where: { showOnPublicWall: true },
    select: { name: true },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  return <LandingPageClient trustedOrgs={orgs.map((o) => o.name)} />;
}
