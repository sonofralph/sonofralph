import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { MovementDialogButton } from "./MovementDialogButton";
import { formatDateTime } from "@/lib/utils";

const movementTypeVariant: Record<string, any> = {
  RECEIPT: "success",
  ISSUE: "danger",
  TRANSFER: "default",
  ADJUSTMENT: "warning",
  WASTAGE: "secondary",
};

export default async function MovementsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const [movements, items, locations] = await Promise.all([
    prisma.stockMovement.findMany({
      where: { item: { organizationId: orgId } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        item: { select: { name: true, sku: true, unit: true } },
        location: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.item.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, unit: true },
    }),
    prisma.location.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Movements</h1>
          <p className="text-sm text-slate-500">
            Track all inventory movements — receipts, issues, transfers, and adjustments
          </p>
        </div>
        <MovementDialogButton items={items} locations={locations} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-slate-400 py-12"
                  >
                    No movements yet. Record your first stock movement above.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(m.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {m.item.name}
                        </p>
                        <p className="text-xs text-slate-400">{m.item.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={movementTypeVariant[m.type] ?? "secondary"}>
                        {m.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${
                          m.type === "RECEIPT"
                            ? "text-green-600"
                            : m.type === "ISSUE" || m.type === "WASTAGE"
                            ? "text-red-600"
                            : "text-slate-700"
                        }`}
                      >
                        {m.type === "RECEIPT" ? "+" : m.type === "ISSUE" || m.type === "WASTAGE" ? "-" : ""}
                        {m.quantity} {m.item.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {m.location.name}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {m.reference ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 max-w-32 truncate">
                      {m.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {m.user.name ?? m.user.email}
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
