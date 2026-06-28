import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, ShieldCheck } from "lucide-react";
import { DataActions } from "./DataActions";

export default async function DataPrivacyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  if (user.role !== "OWNER") redirect("/settings");

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { name: true },
  });
  if (!org) redirect("/login");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Data & Privacy</h1>
        <p className="text-sm text-slate-500">Manage your organization data and account lifecycle.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base">Your data</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataActions orgName={org.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base">GDPR & data rights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>As an organization Owner, you have the right to:</p>
          <ul className="space-y-1.5 list-disc pl-4">
            <li>Access all data held about your organization at any time (Export above)</li>
            <li>Correct inaccurate data via the relevant settings pages</li>
            <li>Erase all data by deleting your account (Delete above)</li>
            <li>Port your data — the JSON export is machine-readable and complete</li>
          </ul>
          <p className="text-slate-500 text-xs pt-2">
            For individual user data requests, contact{" "}
            <a href="mailto:privacy@mise.app" className="text-indigo-600 hover:underline">
              privacy@mise.app
            </a>
            . We respond within 30 days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
