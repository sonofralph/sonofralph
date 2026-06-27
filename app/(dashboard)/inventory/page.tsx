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
import { StockBadge } from "@/components/inventory/StockBadge";
import { InventoryFilters } from "./InventoryFilters";
import { InventoryActions } from "./InventoryActions";
import Link from "next/link";

interface InventoryPageProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    locationId?: string;
    status?: string;
  }>;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;
  const params = await searchParams;

  const [categories, locations, inventoryRecords] = await Promise.all([
    prisma.category.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
    prisma.inventoryRecord.findMany({
      where: {
        item: {
          organizationId: orgId,
          ...(params.search
            ? {
                OR: [
                  { name: { contains: params.search, mode: "insensitive" } },
                  { sku: { contains: params.search, mode: "insensitive" } },
                ],
              }
            : {}),
          ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        },
        ...(params.locationId ? { locationId: params.locationId } : {}),
      },
      include: {
        item: { include: { category: true } },
        location: true,
      },
      orderBy: { item: { name: "asc" } },
    }),
  ]);

  // Filter by stock status client-side after fetching
  const filteredRecords =
    params.status
      ? inventoryRecords.filter((r) => {
          if (params.status === "critical") return r.quantity <= r.minStock;
          if (params.status === "low")
            return r.quantity > r.minStock && r.quantity <= r.reorderPoint;
          if (params.status === "ok") return r.quantity > r.reorderPoint;
          return true;
        })
      : inventoryRecords;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500">
            {filteredRecords.length} records across {locations.length} locations
          </p>
        </div>
        <InventoryActions />
      </div>

      <InventoryFilters categories={categories} locations={locations} />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reorder Point</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-slate-400 py-12"
                  >
                    No inventory records found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Link
                        href={`/inventory/${record.itemId}`}
                        className="font-medium text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {record.item.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                        {record.item.sku}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{record.item.category.name}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {record.location.name}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {record.quantity.toLocaleString()}{" "}
                        <span className="text-xs text-slate-400">
                          {record.item.unit}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {record.reorderPoint} {record.item.unit}
                    </TableCell>
                    <TableCell>
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
