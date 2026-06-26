import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
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

  const alerts = openAlerts.map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    itemName: a.item.name,
    locationName: a.location.name,
    createdAt: a.createdAt,
  }));

  return (
    <div className="flex h-full">
      <Sidebar userRole={user.role} orgName={user.organizationName} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header user={user} alertCount={alertCount} alerts={alerts} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
