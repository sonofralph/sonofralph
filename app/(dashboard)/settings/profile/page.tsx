import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";
import { ProfileForm } from "./ProfileForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ChevronLeft className="h-4 w-4" />
          Settings
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Your Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Update your name and password</p>
      </div>
      <ProfileForm user={user} />
    </div>
  );
}
