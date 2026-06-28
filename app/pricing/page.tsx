import Link from "next/link";
import { ChefHat, Check, X, ArrowRight, Zap, Users, Building2, BarChart3 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Mise",
  description: "Simple, transparent pricing for every stage of your operation. Start free, upgrade when you're ready.",
};

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "For individuals and small teams getting started.",
    highlight: false,
    badge: null,
    cta: { label: "Get started free", href: "/register", style: "outline" },
    limits: { locations: "1 location", users: "3 team members", items: "50 inventory items" },
    support: "Community support",
  },
  {
    key: "PRO",
    name: "Pro",
    price: "$49",
    period: "per month",
    tagline: "For growing operations that need room to scale.",
    highlight: true,
    badge: "Most popular",
    cta: { label: "Start 14-day free trial", href: "/register?plan=pro", style: "solid" },
    limits: { locations: "5 locations", users: "20 team members", items: "Unlimited items" },
    support: "Email support",
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    price: "Custom",
    period: "tailored to you",
    tagline: "For established groups and multi-site operations.",
    highlight: false,
    badge: null,
    cta: { label: "Talk to us", href: "mailto:hello@mise.app?subject=Enterprise enquiry", style: "outline" },
    limits: { locations: "Unlimited locations", users: "Unlimited team members", items: "Unlimited items" },
    support: "Dedicated account manager",
  },
] as const;

const FEATURES = [
  { label: "Stock movements (receive, issue, transfer, adjust, waste)", free: true, pro: true, enterprise: true },
  { label: "Purchase orders (draft → sent → received)", free: true, pro: true, enterprise: true },
  { label: "Suppliers & categories", free: true, pro: true, enterprise: true },
  { label: "Low stock & expiry alerts", free: true, pro: true, enterprise: true },
  { label: "Reports & analytics", free: true, pro: true, enterprise: true },
  { label: "Recipes & expiry tracking", free: true, pro: true, enterprise: true },
  { label: "Departments & P&L accountability", free: true, pro: true, enterprise: true },
  { label: "Shift handovers & requisitions", free: true, pro: true, enterprise: true },
  { label: "Full audit log", free: true, pro: true, enterprise: true },
  { label: "Role-based access control", free: true, pro: true, enterprise: true },
  { label: "CSV import & export", free: true, pro: true, enterprise: true },
  { label: "Email support", free: false, pro: true, enterprise: true },
  { label: "Priority support & SLA", free: false, pro: false, enterprise: true },
  { label: "Custom onboarding", free: false, pro: false, enterprise: true },
  { label: "Dedicated account manager", free: false, pro: false, enterprise: true },
];

const WHY = [
  { icon: Zap, title: "Live across every location", body: "Real-time inventory visibility whether you run one kitchen or twenty. One platform, every site." },
  { icon: Users, title: "Built for your whole team", body: "Role-based access means chefs see what they need, managers see everything, and owners stay in control." },
  { icon: Building2, title: "Hospitality-first design", body: "Built for restaurants, hotels, bars, cafés, catering, and clinics — not adapted from a generic tool." },
  { icon: BarChart3, title: "Margin protection", body: "Track wastage, enforce par levels, and spot over-ordering before it hits the P&L." },
];

function Tick({ value }: { value: boolean }) {
  if (value) return <Check className="h-4 w-4 text-emerald-500 mx-auto" />;
  return <X className="h-4 w-4 text-slate-200 mx-auto" />;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <ChefHat className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">Mise</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-14 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 mb-6">
          <Zap className="h-3 w-3" /> 14-day free trial on Pro — no card required
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Simple pricing.<br />No surprises.
        </h1>
        <p className="mt-5 text-lg text-slate-500 max-w-xl mx-auto">
          Start free and upgrade when your operation grows. Every plan includes the full Mise feature set — the difference is scale.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlight
                  ? "border-indigo-600 bg-indigo-600 shadow-xl shadow-indigo-200"
                  : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900 shadow-sm">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className={`text-sm font-semibold uppercase tracking-widest ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>
                  {plan.name}
                </p>
                <div className="mt-2 flex items-end gap-1">
                  <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.price}
                  </span>
                  <span className={`mb-1 text-sm ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>
                    /{plan.period}
                  </span>
                </div>
                <p className={`mt-2 text-sm ${plan.highlight ? "text-indigo-100" : "text-slate-500"}`}>
                  {plan.tagline}
                </p>
              </div>

              {/* Limits */}
              <ul className="space-y-2.5 mb-8">
                {Object.values(plan.limits).map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <Check className={`h-4 w-4 shrink-0 ${plan.highlight ? "text-indigo-200" : "text-emerald-500"}`} />
                    <span className={plan.highlight ? "text-white font-medium" : "text-slate-700 font-medium"}>{item}</span>
                  </li>
                ))}
                <li className="flex items-center gap-2.5 text-sm">
                  <Check className={`h-4 w-4 shrink-0 ${plan.highlight ? "text-indigo-200" : "text-emerald-500"}`} />
                  <span className={plan.highlight ? "text-indigo-100" : "text-slate-500"}>{plan.support}</span>
                </li>
              </ul>

              <div className="mt-auto">
                <Link
                  href={plan.cta.href}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                    plan.highlight
                      ? "bg-white text-indigo-600 hover:bg-indigo-50 shadow-sm"
                      : plan.key === "ENTERPRISE"
                      ? "border-2 border-amber-400 text-amber-700 hover:bg-amber-50"
                      : "border-2 border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
                  }`}
                >
                  {plan.cta.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                {plan.key === "PRO" && (
                  <p className="mt-2.5 text-center text-xs text-indigo-200">
                    No card needed until trial ends
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <h2 className="text-center text-2xl font-bold text-slate-900 mb-2">Everything that comes with every plan</h2>
        <p className="text-center text-slate-500 text-sm mb-10">All features available on all plans. Scale changes, capability doesn&apos;t.</p>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-4 text-left font-medium text-slate-500">Feature</th>
                {PLANS.map((p) => (
                  <th key={p.key} className={`px-4 py-4 text-center font-semibold ${p.highlight ? "text-indigo-600" : "text-slate-700"}`}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FEATURES.map((f) => (
                <tr key={f.label} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 text-slate-700">{f.label}</td>
                  <td className="px-4 py-3.5 text-center"><Tick value={f.free} /></td>
                  <td className="px-4 py-3.5 text-center"><Tick value={f.pro} /></td>
                  <td className="px-4 py-3.5 text-center"><Tick value={f.enterprise} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Why Mise */}
      <section className="bg-slate-50 border-t border-slate-100 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900 mb-12">Why hospitality teams choose Mise</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map(({ icon: Icon, title, body }) => (
              <div key={title} className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                  <Icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-slate-900 mb-10">Common questions</h2>
        <div className="space-y-8">
          {[
            {
              q: "Do I need a credit card to start the trial?",
              a: "No. The 14-day Pro trial starts the moment you finish onboarding. We only ask for payment details when the trial is about to end.",
            },
            {
              q: "What happens when I hit the Free plan limits?",
              a: "You'll see a clear prompt to upgrade. Your existing data is never deleted — you just won't be able to add more until you upgrade.",
            },
            {
              q: "Can I change plans at any time?",
              a: "Yes. Upgrade instantly from within your account. Downgrades take effect at the end of your billing period.",
            },
            {
              q: "What types of businesses does Mise support?",
              a: "Restaurants, hotels, bars, cafés, catering companies, and clinics. The onboarding wizard tailors the setup to your business type.",
            },
            {
              q: "How does Enterprise pricing work?",
              a: "Enterprise is priced based on your group's size and requirements. Get in touch and we'll put together a proposal within 24 hours.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-slate-100 pb-8 last:border-0 last:pb-0">
              <h3 className="font-semibold text-slate-900 mb-2">{q}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-indigo-600 py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to get everything in its place?</h2>
          <p className="text-indigo-200 mb-8">Join operations that have ditched the spreadsheets. Start free, no card required.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
            >
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`mailto:hello@mise.app?subject=Enterprise enquiry`}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-indigo-400 px-6 py-3 text-sm font-semibold text-white hover:border-white transition-colors"
            >
              Talk to us about Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600">
              <ChefHat className="h-3 w-3 text-white" />
            </div>
            <span>Mise — Hospitality Inventory Management</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-slate-700 transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-slate-700 transition-colors">Register</Link>
            <a href="mailto:hello@mise.app" className="hover:text-slate-700 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
