import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import {
  Card,
  CardContent,
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
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";

const statusVariant: Record<string, any> = {
  DRAFT: "secondary",
  SENT: "default",
  PARTIAL: "warning",
  RECEIVED: "success",
  CANCELLED: "danger",
};

export default async function PurchaseOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const orders = await prisma.purchaseOrder.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: {
      supplier: { select: { name: true } },
      lines: { select: { quantity: true, unitCost: true, receivedQty: true } },
    },
  });

  const canCreate = ["OWNER", "ADMIN", "MANAGER"].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-sm text-slate-500">
            Manage supplier orders and track deliveries
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/purchase-orders/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New PO
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-slate-400 py-12"
                  >
                    No purchase orders yet.{" "}
                    {canCreate && (
                      <Link
                        href="/dashboard/purchase-orders/new"
                        className="text-indigo-600 hover:underline"
                      >
                        Create your first PO
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((po) => {
                  const total = po.lines.reduce(
                    (s, l) => s + l.quantity * l.unitCost,
                    0
                  );
                  const lineCount = po.lines.length;
                  return (
                    <TableRow key={po.id}>
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">
                          PO-{po.id.slice(-6).toUpperCase()}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {po.supplier.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[po.status] ?? "secondary"}>
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {lineCount} line{lineCount !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(total)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(po.orderDate)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {po.expectedDate ? formatDate(po.expectedDate) : "—"}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/purchase-orders/${po.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
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
  );
}
