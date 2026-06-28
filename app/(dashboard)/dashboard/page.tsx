import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockBadge } from "@/components/inventory/StockBadge";
import { MovementAreaChart, CategoryPieChart } from "@/components/dashboard/DashboardCharts";
import {
  Package, AlertTriangle, ShoppingCart, MapPin,
  TrendingDown, ArrowUpRight, ArrowDownRight,
  RefreshCw, Settings, Trash2, TrendingUp, ClipboardList, MessageSquare, Rocket,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DaysRangePicker } from "./DaysRangePicker";

const movementTypeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  RECEIPT:    { icon: ArrowUpRight,  color: "text-emerald-600", bg: "bg-emerald-50", label: "Receipt" },
  ISSUE:      { icon: ArrowDownRight,color: "text-red-600",     bg: "bg-red-50",     label: "Issue" },
  TRANSFER:   { icon: RefreshCw,     color: "text-blue-600",    bg: "bg-blue-50",    label: "Transfer" },
  ADJUSTMENT: { icon: Settings,      color: "text-amber-600",   bg: "bg-amber-50",   label: "Adjustment" },
  WASTAGE:    { icon: Trash2,        color: "text-slate-500",   bg: "bg-slate-50",   label: "Wastage" },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const { days: daysParam } = await searchParams;
  const days = [7, 30, 90].includes(Number(daysParam)) ? Number(daysParam) : 7;

  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - days);
  // keep old name for backwards compat in queries below
  const sevenDaysAgo = rangeStart;

  const [
    totalItems,
    lowStockCount,
    pendingPOCount,
    locationCount,
    recentMovements,
    criticalItems,
    categoryBreakdown,
    movementsLast7Days,
    pendingRequisitions,
    recentHandovers,
    org,
  ] = await Promise.all([
    prisma.item.count({ where: { organizationId: orgId } }),

    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) FROM "InventoryRecord" ir
      JOIN "Item" i ON ir."itemId" = i.id
      WHERE i."organizationId" = ${orgId}
      AND ir.quantity <= ir."reorderPoint"
    `.then((r) => Number(r[0].count)),

    prisma.purchaseOrder.count({
      where: { organizationId: orgId, status: { in: ["DRAFT", "SENT", "PARTIAL"] } },
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
      where: { item: { organizationId: orgId } },
      include: { item: { include: { category: true } }, location: true },
      orderBy: { quantity: "asc" },
      take: 6,
    }),

    prisma.category.findMany({
      where: { organizationId: orgId },
      include: { _count: { select: { items: true } } },
      orderBy: { name: "asc" },
    }),

    prisma.stockMovement.findMany({
      where: {
        item: { organizationId: orgId },
        createdAt: { gte: sevenDaysAgo },
      },
      select: { type: true, quantity: true, createdAt: true },
    }),

    // Role-aware: STAFF sees own pending requests; managers see all pending
    prisma.requisition.findMany({
      where: {
        organizationId: orgId,
        status: "PENDING",
        ...(user.role === "STAFF" ? { requestedById: user.id } : {}),
      },
      include: {
        requestedBy: { select: { name: true, email: true } },
        location: { select: { name: true } },
        lines: { include: { item: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),

    prisma.shiftHandover.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { name: true, email: true, jobTitle: true } },
        location: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),

    prisma.organization.findUnique({
      where: { id: orgId },
      select: { goLiveAt: true },
    }),
  ]);

  // Build chart data: group movements by day
  const labelFormat: Intl.DateTimeFormatOptions =
    days <= 7 ? { weekday: "short" } : { month: "short", day: "numeric" };

  const chartData = Array.from({ length: days }, (_, i) => {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - (days - 1 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const label = dayStart.toLocaleDateString("en-US", labelFormat);
    const dayMovements = movementsLast7Days.filter(
      (m) => m.createdAt >= dayStart && m.createdAt <= dayEnd
    );

    return {
      date: label,
      receipts: dayMovements.filter((m) => m.type === "RECEIPT").reduce((s, m) => s + m.quantity, 0),
      issues: dayMovements.filter((m) => m.type === "ISSUE").reduce((s, m) => s + m.quantity, 0),
      wastage: dayMovements.filter((m) => m.type === "WASTAGE").reduce((s, m) => s + m.quantity, 0),
    };
  });

  const pieData = categoryBreakdown
    .filter((c) => c._count.items > 0)
    .map((c) => ({ name: c.name, value: c._count.items }));

  const kpiCards = [
    {
      title: "Total Items",
      value: totalItems,
      description: "Tracked inventory items",
      icon: Package,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      trend: null,
      href: "/inventory",
    },
    {
      title: "Low Stock",
      value: lowStockCount,
      description: "Need attention",
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: lowStockCount > 0 ? "warning" : "good",
      href: "/inventory?status=low",
    },
    {
      title: "Pending Orders",
      value: pendingPOCount,
      description: "Awaiting delivery",
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: null,
      href: "/purchase-orders",
    },
    {
      title: "Locations",
      value: locationCount,
      description: "Active storage areas",
      icon: MapPin,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: null,
      href: "/locations",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Onboarding nudge for empty orgs */}
      {totalItems === 0 && locationCount === 0 && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4">
          <div>
            <p className="font-semibold text-indigo-900">Finish setting up your account</p>
            <p className="text-sm text-indigo-600 mt-0.5">Add locations and items to start tracking inventory.</p>
          </div>
          <a href="/onboarding" className="shrink-0 ml-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            Complete setup
          </a>
        </div>
      )}

      {/* Go-live nudge: org has items but hasn't entered opening stock */}
      {totalItems > 0 && !org?.goLiveAt && ["OWNER", "ADMIN"].includes(user.role) && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Rocket className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="font-semibold text-amber-900">Set your opening stock to go live</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Enter today&apos;s physical counts so your inventory numbers are accurate from day one.
              </p>
            </div>
          </div>
          <a href="/go-live" className="shrink-0 ml-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors whitespace-nowrap">
            Set opening stock →
          </a>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, {user.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Here&apos;s your inventory overview for today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium capitalize">{user.role.toLowerCase()}</span>
          {user.jobTitle && <span className="text-slate-400">{user.jobTitle}</span>}
        </div>
        <div className="flex items-center gap-3">
          <DaysRangePicker activeDays={days} />
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-600">Live</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", card.bg)}>
                      <Icon className={cn("h-5 w-5", card.color)} />
                    </div>
                    {card.trend === "warning" && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                        <TrendingUp className="h-3 w-3" />
                        Alert
                      </span>
                    )}
                    {card.trend === "good" && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                        Good
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-3xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {typeof card.value === "number" ? card.value.toLocaleString() : "—"}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-slate-600">{card.title}</p>
                    <p className="text-xs text-slate-400">{card.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Role-aware panel */}
      {(pendingRequisitions.length > 0 || recentHandovers.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pendingRequisitions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-base">
                      {user.role === "STAFF" ? "Your Pending Requests" : "Pending Requisitions"}
                    </CardTitle>
                  </div>
                  <Link href="/requisitions" className="text-xs text-indigo-600 hover:underline">View all</Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingRequisitions.map((req) => (
                  <div key={req.id} className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{req.location.name}</p>
                      <p className="text-xs text-slate-500">
                        {req.requestedBy.name ?? req.requestedBy.email} · {req.lines.length} item{req.lines.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Link href="/requisitions" className="shrink-0 text-xs font-medium text-amber-700 hover:underline">
                      {user.role === "STAFF" ? "View" : "Review"}
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {recentHandovers.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-indigo-500" />
                    <CardTitle className="text-base">Latest Handovers</CardTitle>
                  </div>
                  <Link href="/handovers" className="text-xs text-indigo-600 hover:underline">View all</Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentHandovers.map((h) => (
                  <div key={h.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-900">
                        {h.user.name ?? h.user.email}
                        {h.user.jobTitle && <span className="font-normal text-slate-500"> · {h.user.jobTitle}</span>}
                      </p>
                      <span className="text-xs text-slate-400">{h.location.name}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{h.notes}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stock Movement Trend</CardTitle>
            <CardDescription>Receipts vs issues over the last {days} days</CardDescription>
          </CardHeader>
          <CardContent>
            <MovementAreaChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inventory by Category</CardTitle>
            <CardDescription>Item distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={pieData} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Movements */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest stock movements</CardDescription>
            </div>
            <Link href="/movements" className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="pr-6">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-400 py-10">
                      No movements yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentMovements.map((m) => {
                    const config = movementTypeConfig[m.type] ?? movementTypeConfig.RECEIPT;
                    const Icon = config.icon;
                    const isPositive = m.type === "RECEIPT";
                    const isNegative = m.type === "ISSUE" || m.type === "WASTAGE";
                    return (
                      <TableRow key={m.id} className="hover:bg-slate-50/50">
                        <TableCell className="pl-6">
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{m.item.name}</p>
                            <p className="text-xs text-slate-400">{m.item.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", config.bg, config.color)}>
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-sm font-semibold", isPositive ? "text-emerald-600" : isNegative ? "text-red-600" : "text-slate-700")}>
                            {isPositive ? "+" : isNegative ? "-" : ""}{m.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">{m.location.name}</TableCell>
                        <TableCell className="text-xs text-slate-400 pr-6">{formatDateTime(m.createdAt)}</TableCell>
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
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <CardTitle className="text-base">Critical Stock</CardTitle>
            </div>
            <Link href="/inventory?status=critical" className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-slate-600">All stocked up</p>
                <p className="text-xs text-slate-400">No critical items right now</p>
              </div>
            ) : (
              criticalItems.map((record) => (
                <div key={record.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{record.item.name}</p>
                    <p className="text-xs text-slate-400">{record.location.name}</p>
                  </div>
                  <StockBadge
                    quantity={record.quantity}
                    reorderPoint={record.reorderPoint}
                    minStock={record.minStock}
                    unit={record.item.unit}
                    showQty
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
