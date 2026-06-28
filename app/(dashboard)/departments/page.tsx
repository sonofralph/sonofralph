import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Building2 } from "lucide-react";
import { DepartmentsClient } from "./DepartmentsClient";

export default async function DepartmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  if (!["OWNER", "ADMIN"].includes(user.role)) redirect("/dashboard");

  const [departments, locations] = await Promise.all([
    prisma.department.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
      include: {
        locations: { orderBy: { name: "asc" }, select: { id: true, name: true, type: true } },
        _count: { select: { locations: true } },
      },
    }),
    prisma.location.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true, departmentId: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-sm text-slate-500">
            Group locations into departments for reporting and access control
          </p>
        </div>
      </div>

      {departments.length === 0 && locations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-300 mb-3" />
          <p className="text-slate-500">No locations yet</p>
          <p className="text-sm text-slate-400">Add locations first, then organise them into departments.</p>
        </div>
      ) : (
        <DepartmentsClient
          initialDepartments={departments.map((d) => ({
            ...d,
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
          }))}
          allLocations={locations}
        />
      )}
    </div>
  );
}
