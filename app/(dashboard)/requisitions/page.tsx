import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { RequisitionClient } from "./RequisitionClient";

export default async function RequisitionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const user = session.user as SessionUser;

  const where: any = { organizationId: user.organizationId };
  if (user.role === "STAFF") where.requestedById = user.id;

  const [requisitions, locations, items] = await Promise.all([
    prisma.requisition.findMany({
      where,
      include: {
        requestedBy: { select: { id: true, name: true, email: true, jobTitle: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
        location: { select: { id: true, name: true } },
        lines: { include: { item: { select: { id: true, name: true, unit: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.location.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true, unit: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <RequisitionClient
      initialRequisitions={JSON.parse(JSON.stringify(requisitions))}
      locations={locations}
      items={items}
      user={user}
    />
  );
}
