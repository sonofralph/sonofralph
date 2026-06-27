import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function AgingReportPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const { days: daysParam } = await searchParams;
  const threshold = [14, 30, 60, 90].includes(Number(daysParam)) ? Number(daysParam) : 30;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - threshold);

  // Get all inventory records
  const records = await prisma.inventoryRecord.findMany({
    where: { item: { organizationId: orgId }, quantity: { gt: 0 } },
    include: { item: { include: { category: true } }, location: { select: { name: true } } },
  });

  // Get last movement date per item+location
  const lastMovements = await prisma.stockMovement.findMany({
    where: { item: { organizationId: orgId } },
    select: { itemId: true, locationId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    distinct: ["itemId", "locationId"],
  });

  const lastMovementMap: Record<string, Date> = {};
  for (const m of lastMovements) {
    lastMovementMap[`${m.itemId}:${m.locationId}`] = m.createdAt;
  }

  const aged = records
    .map((r) => {
      const lastMoved = lastMovementMap[`${r.itemId}:${r.locationId}`] ?? r.lastUpdated;
      const daysIdle = Math.floor((Date.now() - lastMoved.getTime()) / 86400000);
      return {
        id: r.id,
        itemId: r.itemId,
        name: r.item.name,
        sku: r.item.sku,
        unit: r.item.unit,
        unitCost: r.item.unitCost,
        category: r.item.category.name,
        locationName: r.location.name,
        quantity: r.quantity,
        value: r.quantity * r.item.unitCost,
        lastMoved,
        daysIdle,
        expiryDate: r.expiryDate,
      };
    })
    .filter((r) => r.daysIdle >= threshold)
    .sort((a, b) => b.daysIdle - a.daysIdle);

  const totalAgedValue = aged.reduce((s, r) => s + r.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <Clock className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Inventory Aging Report</h1>
            <p className="text-sm text-slate-500">Items with no movement in the past {threshold} days</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
          {[14, 30, 60, 90].map((d) => (
            <a key={d} href={`/reports/aging?days=${d}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${threshold === d ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              {d}D
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className={`text-2xl font-bold ${aged.length > 0 ? "text-amber-600" : "text-slate-400"}`}>{aged.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Aged records</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalAgedValue)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Value tied up</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-slate-900">
            {aged.length > 0 ? Math.round(aged.reduce((s, r) => s + r.daysIdle, 0) / aged.length) : 0}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Avg days idle</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base">Aged Stock</CardTitle>
          </div>
          <CardDescription>Items with no recorded movement for {threshold}+ days</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Item</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Last Moved</TableHead>
                <TableHead className="pr-5 text-right">Days Idle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-10">
                    No aged stock — all items have had recent movement
                  </TableCell>
                </TableRow>
              ) : (
                aged.map((r) => (
                  <TableRow key={r.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-5">
                      <Link href={`/inventory/${r.itemId}`} className="hover:text-indigo-600">
                        <p className="text-sm font-medium text-slate-900">{r.name}</p>
                        <p className="text-xs text-slate-400">{r.sku} · {r.category}</p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{r.locationName}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {r.quantity} <span className="text-xs text-slate-400">{r.unit}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-600">{formatCurrency(r.value)}</TableCell>
                    <TableCell className="text-sm text-slate-500">{formatDate(r.lastMoved)}</TableCell>
                    <TableCell className="pr-5 text-right">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        r.daysIdle >= 90 ? "bg-red-100 text-red-700" :
                        r.daysIdle >= 60 ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {r.daysIdle}d
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Link href="/reports" className="text-sm font-medium text-indigo-600 hover:underline">← Back to Reports</Link>
      </div>
    </div>
  );
}
