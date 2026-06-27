import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { HandoverClient } from "./HandoverClient";

export default async function HandoversPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const user = session.user as SessionUser;

  const [handovers, locations] = await Promise.all([
    prisma.shiftHandover.findMany({
      where: { organizationId: user.organizationId },
      include: {
        user: { select: { id: true, name: true, email: true, jobTitle: true } },
        location: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.location.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <HandoverClient
      initialHandovers={JSON.parse(JSON.stringify(handovers))}
      locations={locations}
    />
  );
}
