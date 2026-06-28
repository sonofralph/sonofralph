import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { GoLiveClient } from "./GoLiveClient";

export default async function GoLivePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;

  if (!["OWNER", "ADMIN"].includes(user.role)) redirect("/dashboard");

  const [locations, items, org, existingRecords] = await Promise.all([
    prisma.location.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
      include: { category: { select: { name: true } } },
    }),
    prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { goLiveAt: true, name: true },
    }),
    prisma.inventoryRecord.findMany({
      where: { item: { organizationId: user.organizationId } },
      select: { itemId: true, locationId: true, quantity: true },
    }),
  ]);

  if (locations.length === 0) redirect("/onboarding");

  return (
    <GoLiveClient
      locations={locations.map((l) => ({ id: l.id, name: l.name, type: l.type }))}
      items={items.map((i) => ({
        id: i.id,
        name: i.name,
        sku: i.sku,
        unit: i.unit,
        category: i.category.name,
      }))}
      existingRecords={existingRecords}
      isLive={!!org?.goLiveAt}
      goLiveAt={org?.goLiveAt?.toISOString() ?? null}
    />
  );
}
