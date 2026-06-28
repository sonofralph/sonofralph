import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StockBadge } from "@/components/inventory/StockBadge";
import { EditItemForm } from "./EditItemForm";
import { StockAdjustButton } from "./StockAdjustModal";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const { itemId } = await params;

  const [item, categories] = await Promise.all([
    prisma.item.findFirst({
      where: { id: itemId, organizationId: user.organizationId },
      include: {
        category: true,
        inventoryRecords: { include: { location: true } },
        movements: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            location: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    }),
    prisma.category.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!item) notFound();

  const totalQty = item.inventoryRecords.reduce((s, r) => s + r.quantity, 0);
  const canEdit = ["OWNER", "ADMIN", "MANAGER"].includes(user.role);
  const canDelete = ["OWNER", "ADMIN"].includes(user.role);

  const movementTypeColors: Record<string, string> = {
    RECEIPT: "success",
    ISSUE: "danger",
    TRANSFER: "default",
    ADJUSTMENT: "warning",
    WASTAGE: "secondary",
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/inventory" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ChevronLeft className="h-4 w-4" />
          Inventory
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{item.name}</h1>
            <div className="mt-1 flex items-center gap-3 flex-wrap">
              <code className="text-sm bg-slate-100 px-2 py-0.5 rounded">{item.sku}</code>
              <Badge variant="secondary">{item.category.name}</Badge>
              <span className="text-sm text-slate-500">Unit: {item.unit}</span>
              {item.unitCost > 0 && (
                <span className="text-sm text-slate-500">Cost: {formatCurrency(item.unitCost)}/{item.unit}</span>
              )}
            </div>
            {item.description && <p className="mt-2 text-sm text-slate-500">{item.description}</p>}
          </div>
          <div className="text-right shrink-0 ml-4 flex flex-col items-end gap-2">
            <div>
              <p className="text-3xl font-bold text-slate-900">{totalQty.toLocaleString()}</p>
              <p className="text-xs text-slate-500">total {item.unit} in stock</p>
            </div>
            {canEdit && (
              <StockAdjustButton
                itemId={itemId}
                itemName={item.name}
                unit={item.unit}
                locations={item.inventoryRecords.map((r) => ({
                  id: r.locationId,
                  name: r.location.name,
                  currentQty: r.quantity,
                }))}
              />
            )}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <EditItemForm
        itemId={itemId}
        defaultValues={{
          name: item.name,
          sku: item.sku,
          description: item.description ?? "",
          unit: item.unit,
          unitCost: item.unitCost,
          expiryDays: item.expiryDays ?? null,
          categoryId: item.categoryId,
          trackingType: item.trackingType ?? "CONSUMABLE",
        }}
        categories={categories}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      {/* Stock by location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock by Location</CardTitle>
          <CardDescription>Current inventory levels across all locations</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Min</TableHead>
                <TableHead>Reorder</TableHead>
                <TableHead>Max</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.inventoryRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-8">No stock records yet</TableCell>
                </TableRow>
              ) : (
                item.inventoryRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.location.name}</TableCell>
                    <TableCell>{record.quantity} {item.unit}</TableCell>
                    <TableCell className="text-slate-500">{record.minStock}</TableCell>
                    <TableCell className="text-slate-500">{record.reorderPoint}</TableCell>
                    <TableCell className="text-slate-500">{record.maxStock}</TableCell>
                    <TableCell>
                      <StockBadge quantity={record.quantity} reorderPoint={record.reorderPoint} minStock={record.minStock} showQty={false} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Movement history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movement History</CardTitle>
          <CardDescription>Last 20 stock changes for this item</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-8">No movements yet</TableCell>
                </TableRow>
              ) : (
                item.movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm text-slate-500">{formatDateTime(m.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={(movementTypeColors[m.type] as any) ?? "secondary"}>{m.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={m.type === "RECEIPT" ? "text-emerald-600 font-medium" : m.type === "ISSUE" || m.type === "WASTAGE" ? "text-red-600 font-medium" : "text-slate-700"}>
                        {m.type === "RECEIPT" ? "+" : m.type === "ISSUE" || m.type === "WASTAGE" ? "-" : ""}
                        {m.quantity} {item.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{m.location.name}</TableCell>
                    <TableCell className="text-sm text-slate-500">{m.reference ?? "—"}</TableCell>
                    <TableCell className="text-sm text-slate-500">{m.user.name ?? m.user.email}</TableCell>
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
