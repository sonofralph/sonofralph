import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package } from "lucide-react";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Mise</span>
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">ADMIN</span>
          </div>
          <nav className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/admin" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">← App</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
