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
import { AddSupplierButton } from "./AddSupplierButton";
import { SupplierImportButton } from "./SupplierImportButton";
import { Mail, Phone, Building } from "lucide-react";
import Link from "next/link";

export default async function SuppliersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  const orgId = user.organizationId;

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { purchaseOrders: true } },
    },
  });

  const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suppliers</h1>
          <p className="text-sm text-slate-500">
            Manage your vendor and supplier relationships
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <SupplierImportButton />
            <AddSupplierButton />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-slate-200 p-12 text-center">
            <Building className="mx-auto h-8 w-8 text-slate-300 mb-3" />
            <p className="text-slate-500">No suppliers yet</p>
            <p className="text-sm text-slate-400">
              Add your first supplier to start creating purchase orders
            </p>
          </div>
        ) : (
          suppliers.map((supplier) => (
            <Link key={supplier.id} href={`/suppliers/${supplier.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {supplier.name}
                    </h3>
                    {supplier.contact && (
                      <p className="text-sm text-slate-500 mt-0.5">
                        {supplier.contact}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {supplier._count.purchaseOrders} PO
                    {supplier._count.purchaseOrders !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1.5">
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
