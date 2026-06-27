import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, TrendingDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { WastageChart } from "./WastageChart";

export default async function WastagePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const { days: daysParam } = await searchParams;
  const days = [7, 30, 90].includes(Number(daysParam)) ? Number(daysParam) : 30;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const wastageMovements = await prisma.stockMovement.findMany({
    where: {
      item: { organizationId: orgId },
      type: "WASTAGE",
      createdAt: { gte: since },
    },
    include: {
      item: { include: { category: true } },
      location: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Totals
  const totalUnits = wastageMovements.reduce((s, m) => s + m.quantity, 0);
  const totalValue = wastageMovements.reduce((s, m) => s + m.quantity * m.item.unitCost, 0);

  // By category
  const byCategory: Record<string, { name: string; units: number; value: number; count: number }> = {};
  for (const m of wastageMovements) {
    const catName = m.item.category?.name ?? "Uncategorized";
    if (!byCategory[catName]) byCategory[catName] = { name: catName, units: 0, value: 0, count: 0 };
    byCategory[catName].units += m.quantity;
    byCategory[catName].value += m.quantity * m.item.unitCost;
    byCategory[catName].count++;
  }
  const categoryData = Object.values(byCategory).sort((a, b) => b.value - a.value);

  // By item (top wasted)
  const byItem: Record<string, { name: string; sku: string; unit: string; units: number; value: number }> = {};
  for (const m of wastageMovements) {
    if (!byItem[m.itemId]) byItem[m.itemId] = { name: m.item.name, sku: m.item.sku, unit: m.item.unit, units: 0, value: 0 };
    byItem[m.itemId].units += m.quantity;
    byItem[m.itemId].value += m.quantity * m.item.unitCost;
  }
  const topItems = Object.values(byItem).sort((a, b) => b.value - a.value).slice(0, 10);

  // Daily chart data
  const labelFormat: Intl.DateTimeFormatOptions =
    days <= 7 ? { weekday: "short" } : { month: "short", day: "numeric" };

  const chartData = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - (Math.min(days, 30) - 1 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayMovements = wastageMovements.filter(
      (m) => m.createdAt >= dayStart && m.createdAt <= dayEnd
    );
    return {
      date: dayStart.toLocaleDateString("en-US", labelFormat),
      units: dayMovements.reduce((s, m) => s + m.quantity, 0),
      value: dayMovements.reduce((s, m) => s + m.quantity * m.item.unitCost, 0),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Wastage Tracking</h1>
            <p className="text-sm text-slate-500">Food cost loss analysis · last {days} days</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
          {[7, 30, 90].map((d) => (
            <a
              key={d}
              href={`/wastage?days=${d}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                days === d ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {d}D
            </a>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Wastage Events", value: wastageMovements.length.toString(), sub: `in ${days} days`, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Units Wasted", value: totalUnits.toLocaleString(), sub: "across all items", color: "text-red-600", bg: "bg-red-50" },
          { label: "Cost of Wastage", value: formatCurrency(totalValue), sub: "estimated loss", color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Categories Affected", value: categoryData.length.toString(), sub: "with wastage records", color: "text-blue-600", bg: "bg-blue-50" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daily Wastage Trend</CardTitle>
          <CardDescription>Units wasted per day (last {Math.min(days, 30)} days shown)</CardDescription>
        </CardHeader>
        <CardContent>
          <WastageChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* By category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Wastage by Category</CardTitle>
            <CardDescription>Cost of loss per category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryData.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No wastage recorded</p>
            ) : (
              categoryData.map((cat) => {
                const pct = totalValue > 0 ? (cat.value / totalValue) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{cat.name}</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(cat.value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {pct.toFixed(1)}% · {cat.units.toLocaleString()} units · {cat.count} events
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Top wasted items */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <CardTitle className="text-base">Top Wasted Items</CardTitle>
            </div>
            <CardDescription>By cost of loss</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right pr-4">Value Lost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400 py-8">No wastage in this period</TableCell>
                  </TableRow>
                ) : (
                  topItems.map((item, i) => (
                    <TableRow key={item.sku}>
                      <TableCell className="pl-4 text-xs font-bold text-slate-400">#{i + 1}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.sku}</p>
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-600">
                        {item.units.toLocaleString()} <span className="text-xs text-slate-400">{item.unit}</span>
                      </TableCell>
                      <TableCell className="text-right pr-4 font-semibold text-red-600">
                        {formatCurrency(item.value)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent wastage log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Wastage Log</CardTitle>
          <CardDescription>Last {Math.min(wastageMovements.length, 20)} events</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Item</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="pr-4">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wastageMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-8">No wastage recorded in this period</TableCell>
                </TableRow>
              ) : (
                wastageMovements.slice(0, 20).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="pl-4">
                      <p className="text-sm font-medium text-slate-900">{m.item.name}</p>
                      <p className="text-xs text-slate-400">{m.item.sku}</p>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{m.location.name}</TableCell>
                    <TableCell className="text-sm">{m.quantity} {m.item.unit}</TableCell>
                    <TableCell className="text-sm font-medium text-red-600">{formatCurrency(m.quantity * m.item.unitCost)}</TableCell>
                    <TableCell className="text-xs text-slate-400 max-w-[160px] truncate">{m.notes ?? "—"}</TableCell>
                    <TableCell className="pr-4 text-xs text-slate-400">{formatDate(m.createdAt)}</TableCell>
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
