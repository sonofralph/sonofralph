import { prisma } from "@/lib/prisma";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function BarRow({ label, value, max, color = "bg-indigo-500" }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 truncate text-slate-300">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-slate-700 h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-semibold text-white">{value}</span>
    </div>
  );
}

export default async function AdminPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalOrgs,
    totalUsers,
    byPlan,
    byPlanStatus,
    byBusinessType,
    byOrgSize,
    recentOrgs,
    topActions,
    newOrgsThisMonth,
    trialOrgs,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.organization.groupBy({ by: ["plan"], _count: { plan: true } }),
    prisma.organization.groupBy({ by: ["planStatus"], _count: { planStatus: true } }),
    prisma.organization.groupBy({ by: ["businessType"], _count: { businessType: true }, orderBy: { _count: { businessType: "desc" } } }),
    prisma.organization.groupBy({ by: ["orgSize"], _count: { orgSize: true } }),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, name: true, plan: true, planStatus: true, businessType: true, createdAt: true },
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
      take: 10,
    }),
    prisma.organization.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.organization.count({ where: { planStatus: "TRIALING" } }),
  ]);

  const activeProOrgs = byPlan.find((b) => b.plan === "PRO")?._count.plan ?? 0;
  const mrrEstimate = activeProOrgs * 49;

  const planMap = Object.fromEntries(byPlan.map((b) => [b.plan, b._count.plan]));
  const statusMap = Object.fromEntries(byPlanStatus.map((b) => [b.planStatus, b._count.planStatus]));
  const maxBizCount = Math.max(...byBusinessType.map((b) => b._count.businessType), 1);
  const maxActionCount = Math.max(...topActions.map((a) => a._count.action), 1);

  const PLAN_COLORS: Record<string, string> = {
    FREE: "bg-slate-500",
    PRO: "bg-indigo-500",
    ENTERPRISE: "bg-amber-500",
  };
  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "bg-emerald-500",
    TRIALING: "bg-blue-500",
    PAST_DUE: "bg-amber-500",
    CANCELLED: "bg-red-500",
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Operations Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Live stats — {new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}
        </p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Orgs" value={totalOrgs} />
        <StatCard label="Total Users" value={totalUsers} />
        <StatCard label="MRR (est.)" value={`$${mrrEstimate.toLocaleString()}`} sub={`${activeProOrgs} active Pro orgs × $49`} />
        <StatCard label="New (30d)" value={newOrgsThisMonth} sub={`${trialOrgs} on trial`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Plan breakdown */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">By Plan</h2>
          <div className="space-y-3">
            {["FREE", "PRO", "ENTERPRISE"].map((plan) => (
              <BarRow key={plan} label={plan} value={planMap[plan] ?? 0} max={totalOrgs} color={PLAN_COLORS[plan]} />
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">By Status</h2>
          <div className="space-y-3">
            {["ACTIVE", "TRIALING", "PAST_DUE", "CANCELLED"].map((status) => (
              <BarRow key={status} label={status} value={statusMap[status] ?? 0} max={totalOrgs} color={STATUS_COLORS[status]} />
            ))}
          </div>
        </div>

        {/* Org size */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">By Size</h2>
          <div className="space-y-3">
            {byOrgSize.map((s) => (
              <BarRow key={s.orgSize ?? "unknown"} label={s.orgSize ?? "Not set"} value={s._count.orgSize} max={totalOrgs} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Business type */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Business Types</h2>
          <div className="space-y-3">
            {byBusinessType.map((b) => (
              <BarRow key={b.businessType} label={b.businessType} value={b._count.businessType} max={maxBizCount} color="bg-violet-500" />
            ))}
          </div>
        </div>

        {/* Top audit actions (most used features) */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Most Used Features</h2>
          <p className="text-xs text-slate-500">By audit log action count (all-time)</p>
          <div className="space-y-3">
            {topActions.map((a) => (
              <BarRow key={a.action} label={a.action} value={a._count.action} max={maxActionCount} color="bg-emerald-500" />
            ))}
          </div>
        </div>
      </div>

      {/* Recent signups */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Recent Signups</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs text-slate-400">
                <th className="pb-2 pr-4 font-semibold">Organisation</th>
                <th className="pb-2 pr-4 font-semibold">Business Type</th>
                <th className="pb-2 pr-4 font-semibold">Plan</th>
                <th className="pb-2 pr-4 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Signed Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recentOrgs.map((org) => (
                <tr key={org.id} className="text-slate-300">
                  <td className="py-2.5 pr-4 font-medium text-white">{org.name}</td>
                  <td className="py-2.5 pr-4 text-xs">{org.businessType}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      org.plan === "PRO" ? "bg-indigo-900/60 text-indigo-300" :
                      org.plan === "ENTERPRISE" ? "bg-amber-900/60 text-amber-300" :
                      "bg-slate-700 text-slate-300"
                    }`}>{org.plan}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      org.planStatus === "ACTIVE" ? "bg-emerald-900/60 text-emerald-300" :
                      org.planStatus === "TRIALING" ? "bg-blue-900/60 text-blue-300" :
                      org.planStatus === "PAST_DUE" ? "bg-amber-900/60 text-amber-300" :
                      "bg-red-900/60 text-red-300"
                    }`}>{org.planStatus}</span>
                  </td>
                  <td className="py-2.5 text-xs text-slate-400">
                    {new Date(org.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
