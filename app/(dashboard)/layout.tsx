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

  // Get open alert count
  const alertCount = await prisma.alert.count({
    where: {
      organizationId: user.organizationId,
      status: "OPEN",
    },
  });

  return (
    <div className="flex h-full">
      <Sidebar userRole={user.role} orgName={user.organizationName} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header user={user} alertCount={alertCount} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
