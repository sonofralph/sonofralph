import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { formatDateTime } from "@/lib/utils";
import { Shield, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 100;

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN:  "bg-slate-100 text-slate-600",
};

interface AuditPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN"].includes(user.role)) redirect("/dashboard");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);

  const where = { organizationId: user.organizationId };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <Shield className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-500">Full traceable history of all actions · {total.toLocaleString()} entries</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="pr-6">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-10">No audit entries yet</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 text-xs text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
                          <UserCircle className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-900">{log.user.name ?? "Unknown"}</p>
                          <p className="text-[10px] text-slate-400">{log.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", actionColors[log.action] ?? "bg-slate-100 text-slate-600")}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{log.entity}</TableCell>
                    <TableCell className="pr-6 text-xs text-slate-400 max-w-xs truncate">
                      {log.changes ?? log.entityId}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        basePath="/audit"
        searchParams={{ page: params.page }}
      />
    </div>
  );
}
