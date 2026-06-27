import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddLocationButton } from "./AddLocationButton";
import {
  Hotel,
  UtensilsCrossed,
  Wine,
  ChefHat,
  Warehouse,
  Calendar,
  MapPin,
} from "lucide-react";
import type { LocationType } from "@/types";

const locationIcons: Record<LocationType, React.ElementType> = {
  HOTEL: Hotel,
  RESTAURANT: UtensilsCrossed,
  BAR: Wine,
  KITCHEN: ChefHat,
  WAREHOUSE: Warehouse,
  EVENT_SPACE: Calendar,
};

const locationColors: Record<LocationType, string> = {
  HOTEL: "bg-blue-50 text-blue-600",
  RESTAURANT: "bg-orange-50 text-orange-600",
  BAR: "bg-purple-50 text-purple-600",
  KITCHEN: "bg-red-50 text-red-600",
  WAREHOUSE: "bg-slate-50 text-slate-600",
  EVENT_SPACE: "bg-green-50 text-green-600",
};

export default async function LocationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const locations = await prisma.location.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { inventoryRecords: true, movements: true },
      },
    },
  });

  const canManage = ["OWNER", "ADMIN"].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Locations</h1>
          <p className="text-sm text-slate-500">
            Manage your storage and operational locations
          </p>
        </div>
        {canManage && <AddLocationButton />}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locations.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-slate-200 p-12 text-center">
            <MapPin className="mx-auto h-8 w-8 text-slate-300 mb-3" />
            <p className="text-slate-500">No locations yet</p>
            <p className="text-sm text-slate-400">
              Add your first location to start tracking inventory
            </p>
          </div>
        ) : (
          locations.map((location) => {
            const Icon = (locationIcons as any)[location.type] ?? MapPin;
            const colorClass = (locationColors as any)[location.type] ?? "bg-slate-50 text-slate-600";

            return (
              <Card
                key={location.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${colorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {location.name}
                        </h3>
                      </div>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {location.type.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {location._count.inventoryRecords}
                      </p>
                      <p className="text-xs text-slate-500">items tracked</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {location._count.movements}
                      </p>
                      <p className="text-xs text-slate-500">movements</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
