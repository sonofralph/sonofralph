import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StockBadge } from "@/components/inventory/StockBadge";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  MapPin,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Trash2,
  Settings,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const movementTypeIcons: Record<string, React.ElementType> = {
  RECEIPT: ArrowUpRight,
  ISSUE: ArrowDownRight,
  TRANSFER: RefreshCw,
  ADJUSTMENT: Settings,
  WASTAGE: Trash2,
};

const movementTypeColors: Record<string, string> = {
  RECEIPT: "text-green-600",
  ISSUE: "text-red-600",
  TRANSFER: "text-blue-600",
  ADJUSTMENT: "text-amber-600",
  WASTAGE: "text-slate-600",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const [
    totalItems,
    lowStockCount,
    pendingPOCount,
    locationCount,
    recentMovements,
    criticalItems,
  ] = await Promise.all([
    prisma.item.count({ where: { organizationId: orgId } }),

    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) FROM "InventoryRecord" ir
      JOIN "Item" i ON ir."itemId" = i.id
      WHERE i."organizationId" = ${orgId}
      AND ir.quantity <= ir."reorderPoint"
    `.then((r) => Number(r[0].count)),

    prisma.purchaseOrder.count({
      where: {
        organizationId: orgId,
        status: { in: ["DRAFT", "SENT", "PARTIAL"] },
      },
    }),

    prisma.location.count({ where: { organizationId: orgId } }),

    prisma.stockMovement.findMany({
      where: { item: { organizationId: orgId } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        item: { select: { name: true, sku: true } },
        location: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    }),

    prisma.inventoryRecord.findMany({
      where: {
        item: { organizationId: orgId },
      },
      include: {
        item: { include: { category: true } },
        location: true,
      },
      orderBy: { quantity: "asc" },
      take: 5,
    }),
  ]);

  const kpiCards = [
    {
      title: "Total Items",
      value: totalItems.toLocaleString(),
      description: "Tracked inventory items",
      icon: Package,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Low Stock",
      value: typeof lowStockCount === "number" ? lowStockCount.toLocaleString() : "—",
      description: "Items at or below reorder point",
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Pending POs",
      value: pendingPOCount.toLocaleString(),
      description: "Purchase orders in progress",
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Locations",
      value: locationCount.toLocaleString(),
      description: "Active storage locations",
      icon: MapPin,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Good{" "}
          {new Date().getHours() < 12
            ? "morning"
            : new Date().getHours() < 17
            ? "afternoon"
            : "evening"}
          , {user.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm text-slate-500">
          Here&apos;s what&apos;s happening with your inventory today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {card.title}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">
                      {card.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {card.description}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}
                  >
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Movements */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Stock Movements</CardTitle>
            <CardDescription>Latest inventory activity</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMovements.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-slate-400 py-8"
                    >
                      No movements yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentMovements.map((m) => {
                    const Icon =
                      movementTypeIcons[m.type] ?? ArrowUpRight;
                    const color = movementTypeColors[m.type] ?? "text-slate-600";
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">
                              {m.item.name}
                            </p>
                            <p className="text-xs text-slate-400">{m.item.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Icon className={`h-3.5 w-3.5 ${color}`} />
                            <span className="text-xs capitalize text-slate-600">
                              {m.type.toLowerCase()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm font-medium ${
                              m.type === "RECEIPT"
                                ? "text-green-600"
                                : m.type === "ISSUE" || m.type === "WASTAGE"
                                ? "text-red-600"
                                : "text-slate-700"
                            }`}
                          >
                            {m.type === "RECEIPT" ? "+" : m.type === "ISSUE" || m.type === "WASTAGE" ? "-" : ""}
                            {m.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {m.location.name}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {formatDateTime(m.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Critical Stock */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <CardTitle className="text-base">Critical Stock</CardTitle>
            </div>
            <CardDescription>Items running lowest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalItems.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                All items well stocked
              </p>
            ) : (
              criticalItems.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {record.item.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {record.location.name}
                    </p>
                  </div>
                  <StockBadge
                    quantity={record.quantity}
                    reorderPoint={record.reorderPoint}
                    minStock={record.minStock}
                    unit={record.item.unit}
                    showQty={false}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
