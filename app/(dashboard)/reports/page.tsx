import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StockBadge } from "@/components/inventory/StockBadge";
import { TrendingUp, TrendingDown, Package, BarChart3, DollarSign, ShoppingCart, Clock } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { ExportButton } from "@/components/ui/ExportButton";

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
    inventoryRecords,
    categoryBreakdown,
    lowStockItems,
    poSummary,
  ] = await Promise.all([
    prisma.stockMovement.groupBy({
      by: ["type"],
      where: { item: { organizationId: orgId }, createdAt: { gte: thirtyDaysAgo } },
      _count: true,
      _sum: { quantity: true },
    }),
    prisma.stockMovement.groupBy({
      by: ["itemId"],
      where: { item: { organizationId: orgId }, type: "ISSUE", createdAt: { gte: thirtyDaysAgo } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    prisma.inventoryRecord.findMany({
      where: { item: { organizationId: orgId } },
      include: { item: { include: { category: true } }, location: true },
    }),
    prisma.item.groupBy({
      by: ["categoryId"],
      where: { organizationId: orgId },
      _count: true,
    }),
    prisma.inventoryRecord.findMany({
      where: { item: { organizationId: orgId } },
      include: { item: { include: { category: true } }, location: true },
    }).then((r) => r.filter((rec) => rec.quantity <= rec.reorderPoint)),
    prisma.purchaseOrder.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: true,
      _sum: { totalAmount: true },
    }),
  ]);

  const itemIds = topIssuedItems.map((i) => i.itemId);
  const [itemNames, categories] = await Promise.all([
    prisma.item.findMany({ where: { id: { in: itemIds } }, select: { id: true, name: true, sku: true, unit: true } }),
    prisma.category.findMany({ where: { organizationId: orgId }, select: { id: true, name: true } }),
  ]);
  const itemMap = Object.fromEntries(itemNames.map((i) => [i.id, i]));
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const receiptTotal = movementSummary.find((m) => m.type === "RECEIPT")?._sum.quantity ?? 0;
  const issueTotal = movementSummary.find((m) => m.type === "ISSUE")?._sum.quantity ?? 0;
  const wastageTotal = movementSummary.find((m) => m.type === "WASTAGE")?._sum.quantity ?? 0;

  // Inventory value by category
  const totalStockValue = inventoryRecords.reduce((sum, r) => sum + r.quantity * r.item.unitCost, 0);
  const valueByCategory: Record<string, { name: string; value: number; count: number }> = {};
  for (const r of inventoryRecords) {
    const catId = r.item.categoryId;
    const catName = catMap[catId]?.name ?? "Uncategorized";
    if (!valueByCategory[catId]) valueByCategory[catId] = { name: catName, value: 0, count: 0 };
    valueByCategory[catId].value += r.quantity * r.item.unitCost;
    valueByCategory[catId].count += 1;
  }
  const categoryValues = Object.values(valueByCategory).sort((a, b) => b.value - a.value);

  const pendingPOValue = poSummary.filter((p) => ["DRAFT","SENT","PARTIAL"].includes(p.status)).reduce((s, p) => s + (p._sum.totalAmount ?? 0), 0);
  const pendingPOCount = poSummary.filter((p) => ["DRAFT","SENT","PARTIAL"].includes(p.status)).reduce((s, p) => s + p._count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500">Inventory analytics · last 30 days</p>
        </div>
        <div className="flex gap-2">
          <ExportButton endpoint="/api/export/inventory" />
          <ExportButton endpoint="/api/export/movements" />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Stock Value", value: formatCurrency(totalStockValue), sub: "total inventory value", icon: DollarSign, bg: "bg-indigo-50", color: "text-indigo-600" },
          { label: "Units Received", value: (receiptTotal ?? 0).toLocaleString(), sub: "in last 30 days", icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Units Consumed", value: (issueTotal ?? 0).toLocaleString(), sub: "in last 30 days", icon: TrendingDown, bg: "bg-red-50", color: "text-red-600" },
          { label: "Wastage", value: (wastageTotal ?? 0).toLocaleString(), sub: "units wasted", icon: Package, bg: "bg-amber-50", color: "text-amber-600" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg}`}>
                    <Icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{kpi.label}</p>
                    <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
                    <p className="text-xs text-slate-400">{kpi.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Inventory value by category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Value by Category</CardTitle>
            <CardDescription>Total inventory value · {formatCurrency(totalStockValue)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryValues.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No inventory data</p>
            ) : (
              categoryValues.map((cat) => {
                const pct = totalStockValue > 0 ? (cat.value / totalStockValue) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{cat.name}</span>
                      <span className="text-slate-900 font-semibold">{formatCurrency(cat.value)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{pct.toFixed(1)}% of total · {cat.count} items</p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Top consumed items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Consumed Items</CardTitle>
            <CardDescription>Most issued in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right pr-4">Qty Issued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topIssuedItems.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-slate-400 py-8">No issue movements in the last 30 days</TableCell></TableRow>
                ) : (
                  topIssuedItems.map((item, i) => {
                    const info = itemMap[item.itemId];
                    return (
                      <TableRow key={item.itemId}>
                        <TableCell className="pl-4 text-xs font-bold text-slate-400">#{i + 1}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-slate-900">{info?.name ?? "Unknown"}</p>
                          <p className="text-xs text-slate-400">{info?.sku}</p>
                        </TableCell>
                        <TableCell className="text-right pr-4 font-medium text-sm">
                          {(item._sum.quantity ?? 0).toLocaleString()} <span className="text-xs text-slate-400">{info?.unit}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low stock / reorder needed */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">Reorder Required</CardTitle>
            </div>
            <CardDescription>{lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""} at or below reorder point</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Item</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Qty / Reorder</TableHead>
                  <TableHead className="pr-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">All items above reorder point</TableCell></TableRow>
                ) : (
                  lowStockItems.slice(0, 8).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="pl-4">
                        <p className="text-sm font-medium text-slate-900">{record.item.name}</p>
                        <Badge variant="secondary" className="text-[10px] mt-0.5">{record.item.category.name}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{record.location.name}</TableCell>
                      <TableCell className="text-sm">{record.quantity} / {record.reorderPoint} {record.item.unit}</TableCell>
                      <TableCell className="pr-4">
                        <StockBadge quantity={record.quantity} reorderPoint={record.reorderPoint} minStock={record.minStock} showQty={false} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* PO summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-base">Purchase Order Summary</CardTitle>
            </div>
            <CardDescription>{pendingPOCount} pending order{pendingPOCount !== 1 ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {poSummary.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No purchase orders yet</p>
            ) : (
              poSummary.map((po) => (
                <div key={po.status} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700 capitalize">{po.status.toLowerCase()}</p>
                    <p className="text-xs text-slate-400">{po._count} order{po._count !== 1 ? "s" : ""}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(po._sum.totalAmount ?? 0)}</p>
                </div>
              ))
            )}
            {pendingPOValue > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                <p className="text-sm font-semibold text-slate-700">Pending value</p>
                <p className="text-sm font-bold text-indigo-600">{formatCurrency(pendingPOValue)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Quick links to sub-reports */}
      <div className="flex items-center gap-3">
        <Link href="/reports/aging" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
          <Clock className="h-4 w-4 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Inventory Aging Report</p>
            <p className="text-xs text-slate-400">Items with no movement in 14–90 days</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
