import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Building2, Calendar, Package } from "lucide-react";
import Link from "next/link";
import { ReceivePOForm } from "./ReceivePOForm";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  DRAFT:     "bg-slate-100 text-slate-600",
  SENT:      "bg-blue-100 text-blue-700",
  PARTIAL:   "bg-amber-100 text-amber-700",
  RECEIVED:  "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function PODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const canReceive = ["OWNER", "ADMIN", "MANAGER"].includes(user.role);

  const po = await prisma.purchaseOrder.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      supplier: true,
      lines: {
        include: { item: { select: { id: true, name: true, sku: true, unit: true } } },
      },
    },
  });

  if (!po) notFound();

  const total = po.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
  const totalReceived = po.lines.reduce((s, l) => s + l.receivedQty, 0);
  const totalOrdered = po.lines.reduce((s, l) => s + l.quantity, 0);
  const isComplete = po.status === "RECEIVED" || po.status === "CANCELLED";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/purchase-orders" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">PO-{po.id.slice(-6).toUpperCase()}</h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusColors[po.status] ?? "bg-slate-100 text-slate-600")}>{po.status}</span>
          </div>
          <p className="text-sm text-slate-500">Purchase order details and receiving</p>
        </div>
      </div>

      {/* PO metadata */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><Building2 className="h-3.5 w-3.5 text-slate-400" /><p className="text-xs text-slate-500">Supplier</p></div>
          <p className="text-sm font-semibold text-slate-900">{po.supplier.name}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><Calendar className="h-3.5 w-3.5 text-slate-400" /><p className="text-xs text-slate-500">Order Date</p></div>
          <p className="text-sm font-semibold text-slate-900">{formatDate(po.orderDate)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><Calendar className="h-3.5 w-3.5 text-slate-400" /><p className="text-xs text-slate-500">Expected</p></div>
          <p className="text-sm font-semibold text-slate-900">{po.expectedDate ? formatDate(po.expectedDate) : "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><Package className="h-3.5 w-3.5 text-slate-400" /><p className="text-xs text-slate-500">Progress</p></div>
          <p className="text-sm font-semibold text-slate-900">{totalReceived} / {totalOrdered} units</p>
        </CardContent></Card>
      </div>

      {/* Line items */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <p className="text-sm font-semibold text-slate-700">Total: {formatCurrency(total)}</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {canReceive && !isComplete ? (
            <ReceivePOForm po={{ id: po.id, status: po.status, lines: po.lines.map((l) => ({ id: l.id, quantity: l.quantity, receivedQty: l.receivedQty, unitCost: l.unitCost, item: l.item })) }} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500">Item</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Ordered</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Received</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500">Unit Cost</th>
                </tr>
              </thead>
              <tbody>
                {po.lines.map((line) => (
                  <tr key={line.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-slate-900">{line.item.name}</p>
                      <p className="text-xs text-slate-400">{line.item.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{line.quantity} {line.item.unit}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-medium", line.receivedQty >= line.quantity ? "text-emerald-600" : line.receivedQty > 0 ? "text-amber-600" : "text-slate-400")}>
                        {line.receivedQty} {line.item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-slate-700">{formatCurrency(line.unitCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {po.notes && (
        <Card><CardContent className="p-4">
          <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
          <p className="text-sm text-slate-700">{po.notes}</p>
        </CardContent></Card>
      )}
    </div>
  );
}
