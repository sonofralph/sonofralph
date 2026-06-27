import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { Bell } from "lucide-react";
import { NotificationPreferencesForm } from "./NotificationPreferencesForm";
import { DigestButton } from "./DigestButton";

const ALERT_TYPES = ["LOW_STOCK", "OUT_OF_STOCK", "EXPIRY"];

export default async function NotificationSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;

  const saved = await prisma.notificationPreference.findMany({
    where: { userId: user.id },
  });

  const prefs = ALERT_TYPES.map((type) => ({
    alertType: type,
    email: saved.find((p) => p.alertType === type)?.email ?? true,
  }));

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
          <Bell className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notification Preferences</h1>
          <p className="text-sm text-slate-500">Choose which email alerts you receive</p>
        </div>
      </div>

      <NotificationPreferencesForm initialPrefs={prefs} />

      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Weekly Digest</p>
          <p className="text-sm text-slate-500">Sent every Monday to all admins</p>
        </div>
        <DigestButton />
      </div>

      <p className="text-xs text-slate-400">
        Alert emails are sent to <span className="font-medium text-slate-600">{user.email}</span>
      </p>
    </div>
  );
}
