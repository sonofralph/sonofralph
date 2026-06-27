import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockBadge } from "@/components/inventory/StockBadge";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Layers } from "lucide-react";

export default async function ConsolidatedInventoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const records = await prisma.inventoryRecord.findMany({
    where: { item: { organizationId: orgId } },
    include: {
      item: { include: { category: true } },
      location: { select: { name: true } },
    },
    orderBy: { item: { name: "asc" } },
  });

  // Consolidate by item
  const byItem: Record<string, {
    itemId: string;
    name: string;
    sku: string;
    unit: string;
    unitCost: number;
    category: string;
    totalQty: number;
    totalValue: number;
    minReorderPoint: number;
    minMinStock: number;
    locations: { name: string; qty: number }[];
  }> = {};

  for (const r of records) {
    if (!byItem[r.itemId]) {
      byItem[r.itemId] = {
        itemId: r.itemId,
        name: r.item.name,
        sku: r.item.sku,
        unit: r.item.unit,
        unitCost: r.item.unitCost,
        category: r.item.category.name,
        totalQty: 0,
        totalValue: 0,
        minReorderPoint: r.reorderPoint,
        minMinStock: r.minStock,
        locations: [],
      };
    }
    byItem[r.itemId].totalQty += r.quantity;
    byItem[r.itemId].totalValue += r.quantity * r.item.unitCost;
    byItem[r.itemId].minReorderPoint = Math.max(byItem[r.itemId].minReorderPoint, r.reorderPoint);
    byItem[r.itemId].locations.push({ name: r.location.name, qty: r.quantity });
  }

  const items = Object.values(byItem).sort((a, b) => a.name.localeCompare(b.name));
  const grandTotal = items.reduce((s, i) => s + i.totalValue, 0);
  const lowCount = items.filter((i) => i.totalQty <= i.minReorderPoint).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
            <Layers className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Consolidated Inventory</h1>
            <p className="text-sm text-slate-500">Total stock across all locations</p>
          </div>
        </div>
        <Link href="/inventory" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Per-location view
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-indigo-600">{items.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Unique items</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(grandTotal)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total stock value</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className={`text-2xl font-bold ${lowCount > 0 ? "text-amber-600" : "text-slate-400"}`}>{lowCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Need restocking</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead className="pr-5">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-10">No inventory data</TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.itemId} className="hover:bg-slate-50/50">
                    <TableCell className="pl-5">
                      <Link href={`/inventory/${item.itemId}`} className="hover:text-indigo-600">
                        <p className="text-sm font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.sku}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold text-slate-900">
                      {item.totalQty} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-600">
                      {formatCurrency(item.totalValue)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.locations.map((l) => (
                          <span key={l.name} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                            {l.name}: {l.qty}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="pr-5">
                      <StockBadge
                        quantity={item.totalQty}
                        reorderPoint={item.minReorderPoint}
                        minStock={item.minMinStock}
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
  );
}
