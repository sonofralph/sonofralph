import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SessionUser } from "@/types";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as SessionUser;

  // Get open alerts with preview data
  const openAlerts = await prisma.alert.findMany({
    where: { organizationId: user.organizationId, status: "OPEN" },
    include: { item: { select: { name: true } }, location: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const alertCount = await prisma.alert.count({
    where: { organizationId: user.organizationId, status: "OPEN" },
  });

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { logoUrl: true, brandColor: true },
  });

  const alerts = openAlerts.map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    itemName: a.item.name,
    locationName: a.location.name,
    createdAt: a.createdAt,
  }));

  return (
    <DashboardShell
      user={user}
      alertCount={alertCount}
      alerts={alerts}
      logoUrl={org?.logoUrl ?? null}
      brandColor={org?.brandColor ?? null}
    >
      {children}
    </DashboardShell>
  );
}
