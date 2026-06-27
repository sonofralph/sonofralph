import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockBadge } from "@/components/inventory/StockBadge";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;

  const location = await prisma.location.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      inventoryRecords: {
        include: { item: { include: { category: true } } },
        orderBy: { quantity: "asc" },
      },
    },
  });

  if (!location) notFound();

  const totalValue = location.inventoryRecords.reduce(
    (s, r) => s + r.quantity * r.item.unitCost, 0
  );
  const lowStockCount = location.inventoryRecords.filter(
    (r) => r.quantity <= r.reorderPoint
  ).length;
  const outCount = location.inventoryRecords.filter((r) => r.quantity === 0).length;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/locations" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </Link>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-slate-400" />
          <h1 className="text-xl font-bold text-slate-900">{location.name}</h1>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            {location.type.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Items Tracked", value: location.inventoryRecords.length, color: "text-indigo-600" },
          { label: "Stock Value", value: formatCurrency(totalValue), color: "text-emerald-600" },
          { label: "Low Stock", value: lowStockCount, color: lowStockCount > 0 ? "text-amber-600" : "text-slate-400" },
          { label: "Out of Stock", value: outCount, color: outCount > 0 ? "text-red-600" : "text-slate-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Inventory snapshot */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Inventory Snapshot</CardTitle>
          <CardDescription>All items tracked at this location</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Reorder At</TableHead>
                <TableHead className="pr-5 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {location.inventoryRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-10">
                    No items tracked here yet
                  </TableCell>
                </TableRow>
              ) : (
                location.inventoryRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-5">
                      <Link href={`/inventory/${record.itemId}`} className="hover:text-indigo-600">
                        <p className="text-sm font-medium text-slate-900">{record.item.name}</p>
                        <p className="text-xs text-slate-400">{record.item.sku}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {record.item.category.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-slate-900">
                      {record.quantity} <span className="text-xs text-slate-400">{record.item.unit}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-600">
                      {formatCurrency(record.quantity * record.item.unitCost)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-400">
                      {record.reorderPoint} {record.item.unit}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
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
  );
}
