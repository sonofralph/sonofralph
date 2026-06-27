import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const [locationCount, itemCount] = await Promise.all([
    prisma.location.count({ where: { organizationId: orgId } }),
    prisma.item.count({ where: { organizationId: orgId } }),
  ]);

  // Already set up — send to dashboard
  if (locationCount > 0 && itemCount > 0) redirect("/dashboard");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-12 px-4">
      <OnboardingWizard
        orgName={user.organizationName}
        hasLocations={locationCount > 0}
        hasItems={itemCount > 0}
      />
    </div>
  );
}
