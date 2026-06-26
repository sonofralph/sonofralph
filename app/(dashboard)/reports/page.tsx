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
import { TrendingUp, TrendingDown, Package, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    movementSummary,
    topIssuedItems,
    categoryBreakdown,
    lowStockItems,
    poSummary,
  ] = await Promise.all([
    // Movement totals by type (last 30 days)
    prisma.stockMovement.groupBy({
      by: ["type"],
      where: {
        item: { organizationId: orgId },
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      _sum: { quantity: true },
    }),

    // Top issued items (most consumed)
    prisma.stockMovement.groupBy({
      by: ["itemId"],
      where: {
        item: { organizationId: orgId },
        type: "ISSUE",
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),

    // Items per category
    prisma.item.groupBy({
      by: ["categoryId"],
      where: { organizationId: orgId },
      _count: true,
    }),

    // Low stock items
    prisma.inventoryRecord.findMany({
      where: {
        item: { organizationId: orgId },
      },
      include: {
        item: { include: { category: true } },
        location: true,
      },
    }).then((records) =>
      records.filter((r) => r.quantity <= r.reorderPoint)
    ),

    // PO summary
    prisma.purchaseOrder.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: true,
      _sum: { totalAmount: true },
    }),
  ]);

  // Fetch item names for top issued
  const itemIds = topIssuedItems.map((i) => i.itemId);
  const itemNames = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, name: true, sku: true, unit: true },
  });
  const itemMap = Object.fromEntries(itemNames.map((i) => [i.id, i]));

  // Fetch category names
  const categoryIds = categoryBreakdown.map((c) => c.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const receiptTotal =
    movementSummary.find((m) => m.type === "RECEIPT")?._sum.quantity ?? 0;
  const issueTotal =
    movementSummary.find((m) => m.type === "ISSUE")?._sum.quantity ?? 0;
  const wastageTotal =
    movementSummary.find((m) => m.type === "WASTAGE")?._sum.quantity ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">
          Inventory analytics for the last 30 days
        </p>
      </div>

      {/* Movement overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Receipts</p>
                <p className="text-2xl font-bold text-slate-900">
                  {(receiptTotal ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">units received</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Issues</p>
                <p className="text-2xl font-bold text-slate-900">
                  {(issueTotal ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">units consumed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Wastage</p>
                <p className="text-2xl font-bold text-slate-900">
                  {(wastageTotal ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">units wasted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top consumed items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Consumed Items</CardTitle>
            <CardDescription>Most issued items in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty Issued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topIssuedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-400 py-8">
                      No issue movements in the last 30 days
                    </TableCell>
                  </TableRow>
                ) : (
                  topIssuedItems.map((item, i) => {
                    const itemInfo = itemMap[item.itemId];
                    return (
                      <TableRow key={item.itemId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 w-5">
                              #{i + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {itemInfo?.name ?? "Unknown"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {itemInfo?.sku}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {(item._sum.quantity ?? 0).toLocaleString()}{" "}
                          <span className="text-xs text-slate-400">
                            {itemInfo?.unit}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low stock items */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">Items Needing Reorder</CardTitle>
            </div>
            <CardDescription>
              Currently at or below reorder point
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400 py-8">
                      All items above reorder point
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStockItems.slice(0, 10).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <p className="text-sm font-medium text-slate-900">
                          {record.item.name}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-0.5">
                          {record.item.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {record.location.name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.quantity} / {record.reorderPoint}{" "}
                        {record.item.unit}
                      </TableCell>
                      <TableCell>
                        <StockBadge
                          quantity={record.quantity}
                          reorderPoint={record.reorderPoint}
                          minStock={record.minStock}
                          showQty={false}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items by Category</CardTitle>
          <CardDescription>Distribution of inventory items across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categoryBreakdown.map((cat) => {
              const catInfo = catMap[cat.categoryId];
              return (
                <div
                  key={cat.categoryId}
                  className="rounded-lg bg-slate-50 p-4 text-center"
                >
                  <p className="text-2xl font-bold text-slate-900">
                    {cat._count}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {catInfo?.name ?? "Unknown"}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
