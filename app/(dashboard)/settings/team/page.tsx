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
import { InviteUserButton } from "./InviteUserButton";
import { MemberActions } from "./MemberActions";
import { formatDate } from "@/lib/utils";
import { User } from "lucide-react";

const roleColors: Record<string, any> = {
  OWNER: "default",
  ADMIN: "warning",
  MANAGER: "secondary",
  STAFF: "outline",
};

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;

  if (!["OWNER", "ADMIN"].includes(user.role)) {
    redirect("/dashboard");
  }

  const members = await prisma.user.findMany({
    where: { organizationId: user.organizationId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
          <p className="text-sm text-slate-500">
            {members.length} member{members.length !== 1 ? "s" : ""} in your
            organization
          </p>
        </div>
        <InviteUserButton />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{member.name ?? "—"}</p>
                        {member.jobTitle && (
                          <p className="text-xs text-slate-500">{member.jobTitle}</p>
                        )}
                        {member.id === user.id && (
                          <span className="text-xs text-indigo-600">(you)</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleColors[member.role] ?? "secondary"}>{member.role}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">{formatDate(member.createdAt)}</TableCell>
                  <TableCell>
                    <MemberActions
                      memberId={member.id}
                      currentRole={member.role as any}
                      actorRole={user.role as any}
                      isSelf={member.id === user.id}
                      isOwner={member.role === "OWNER"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Permissions</CardTitle>
          <CardDescription>
            What each role can see and do in Mise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-slate-500">
                    Permission
                  </th>
                  {["STAFF", "MANAGER", "ADMIN", "OWNER"].map((role) => (
                    <th
                      key={role}
                      className="text-center py-2 px-3 font-medium text-slate-500"
                    >
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["View inventory", true, true, true, true],
                  ["Record movements", true, true, true, true],
                  ["Create purchase orders", false, true, true, true],
                  ["Manage suppliers", false, true, true, true],
                  ["View reports", false, true, true, true],
                  ["Manage locations", false, false, true, true],
                  ["Manage team", false, false, true, true],
                  ["Billing & settings", false, false, false, true],
                ].map(([perm, ...access]) => (
                  <tr key={perm as string}>
                    <td className="py-2 pr-4 text-slate-700">{perm as string}</td>
                    {(access as boolean[]).map((allowed, i) => (
                      <td key={i} className="text-center py-2 px-3">
                        {allowed ? (
                          <span className="text-green-500">✓</span>
                        ) : (
                          <span className="text-slate-200">✗</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
