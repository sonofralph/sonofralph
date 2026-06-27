import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EditSupplierForm } from "./EditSupplierForm";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft, ShoppingCart, TrendingUp, Clock, CheckCircle2, XCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  DRAFT: "secondary",
  SENT: "default",
  PARTIAL: "warning",
  RECEIVED: "success",
  CANCELLED: "danger",
};

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const { id } = await params;

  const supplier = await prisma.supplier.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { lines: true } },
        },
      },
    },
  });

  if (!supplier) notFound();

  const canEdit = ["OWNER", "ADMIN", "MANAGER"].includes(user.role);
  const canDelete = ["OWNER", "ADMIN"].includes(user.role);

  const allPOs = supplier.purchaseOrders;
  const receivedPOs = allPOs.filter((po) => po.status === "RECEIVED");
  const cancelledPOs = allPOs.filter((po) => po.status === "CANCELLED");
  const totalSpend = receivedPOs.reduce((s, po) => s + po.totalAmount, 0);

  // On-time delivery: received before or on expectedDate
  const onTimeCount = receivedPOs.filter(
    (po) => po.expectedDate && po.updatedAt <= po.expectedDate
  ).length;
  const onTimePct = receivedPOs.length > 0 ? Math.round((onTimeCount / receivedPOs.length) * 100) : null;

  // Average order value
  const avgOrderValue = receivedPOs.length > 0 ? totalSpend / receivedPOs.length : 0;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/suppliers" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ChevronLeft className="h-4 w-4" />
          Suppliers
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{supplier.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {supplier.purchaseOrders.length} order{supplier.purchaseOrders.length !== 1 ? "s" : ""}
              {totalSpend > 0 && ` · ${formatCurrency(totalSpend)} total spend`}
            </p>
          </div>
        </div>
      </div>

      <EditSupplierForm
        supplierId={id}
        defaultValues={{
          name: supplier.name,
          contact: supplier.contact ?? "",
          email: supplier.email ?? "",
          phone: supplier.phone ?? "",
          address: supplier.address ?? "",
        }}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      {/* Performance stats */}
      {allPOs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Orders", value: allPOs.length.toString(), icon: ShoppingCart, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Total Spend", value: formatCurrency(totalSpend), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "On-time Delivery", value: onTimePct !== null ? `${onTimePct}%` : "—", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Avg Order Value", value: avgOrderValue > 0 ? formatCurrency(avgOrderValue) : "—", icon: CheckCircle2, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} mb-2`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Purchase order history */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Purchase Orders</CardTitle>
            <CardDescription>Recent orders from this supplier</CardDescription>
          </div>
          {canEdit && (
            <Link href={`/purchase-orders/new?supplierId=${id}`}>
              <ShoppingCart className="h-4 w-4 mr-1.5 inline" />
              <span className="text-xs font-medium text-indigo-600 hover:underline">New PO</span>
            </Link>
          )}
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplier.purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                    No purchase orders yet
                  </TableCell>
                </TableRow>
              ) : (
                supplier.purchaseOrders.slice(0, 20).map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <Link href={`/purchase-orders/${po.id}`} className="font-medium text-indigo-600 hover:underline">
                        {po.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(statusColors[po.status] as any) ?? "secondary"}>
                        {po.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{po._count.lines}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(po.totalAmount)}</TableCell>
                    <TableCell className="text-sm text-slate-500">{formatDateTime(po.createdAt)}</TableCell>
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
