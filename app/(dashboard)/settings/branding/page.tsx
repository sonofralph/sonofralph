import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Palette } from "lucide-react";
import { BrandingForm } from "./BrandingForm";

export default async function BrandingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;
  if (user.role !== "OWNER") redirect("/settings");

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { logoUrl: true, brandColor: true, showOnPublicWall: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
          <Palette className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Branding</h1>
          <p className="text-sm text-slate-500">Customise the app with your organisation's logo and colours</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <BrandingForm
          initialLogoUrl={org?.logoUrl ?? null}
          initialBrandColor={org?.brandColor ?? null}
          initialShowOnPublicWall={org?.showOnPublicWall ?? false}
        />
      </div>
    </div>
  );
}
