"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Package, BarChart3, ShoppingCart, Users, Shield, Zap,
  ChevronRight, CheckCircle2, Star, ArrowRight, Globe, ChevronDown,
} from "lucide-react";
import { translations, languages, type Language } from "@/lib/i18n/translations";

const STORAGE_KEY = "mise-lang";

function LanguageSwitcher({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = languages.find((l) => l.code === lang)!;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-colors"
        aria-label="Select language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{current.nativeName}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-slate-50 ${
                l.code === lang ? "font-semibold text-indigo-600" : "text-slate-700"
              }`}
            >
              {l.nativeName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LandingPageClient() {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && languages.find((l) => l.code === saved)) setLangState(saved);
  }, []);

  function setLang(l: Language) {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }

  const t = translations[lang];
  const dir = languages.find((l) => l.code === lang)?.dir;
  const featureIcons = [Package, ShoppingCart, BarChart3, Users, Shield, Zap];
  const featureColors = [
    "bg-indigo-100 text-indigo-600",
    "bg-blue-100 text-blue-600",
    "bg-emerald-100 text-emerald-600",
    "bg-amber-100 text-amber-600",
    "bg-rose-100 text-rose-600",
    "bg-violet-100 text-violet-600",
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900" dir={dir}>
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Mise</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features"      className="hover:text-slate-900 transition-colors">{t.nav.features}</a>
            <a href="#pricing"       className="hover:text-slate-900 transition-colors">{t.nav.pricing}</a>
            <a href="#testimonials"  className="hover:text-slate-900 transition-colors">{t.nav.customers}</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              {t.nav.signIn}
            </Link>
            <Link href="/register" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              {t.nav.startFree}
            </Link>
            <LanguageSwitcher lang={lang} setLang={setLang} />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 to-white px-6 pb-24 pt-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700">
            <Zap className="h-3.5 w-3.5" />
            {t.hero.badge}
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
            {t.hero.h1Line1}
            <br />
            <span className="text-indigo-600">{t.hero.h1Line2}</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-500">{t.hero.description}</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:shadow-indigo-300">
              {t.hero.ctaPrimary} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all">
              {t.hero.ctaSecondary}
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">{t.hero.note}</p>
        </div>

        {/* Dashboard mockup */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/80 overflow-hidden">
            <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs text-slate-400">mise.app/inventory</span>
            </div>
            <div className="grid grid-cols-4 gap-4 p-6">
              {[
                { label: "Stock Value",      value: "$48,320", color: "text-indigo-600",  bg: "bg-indigo-50" },
                { label: "Low Stock Alerts", value: "7 items", color: "text-amber-600",   bg: "bg-amber-50" },
                { label: "Units Received",   value: "1,284",   color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Open POs",         value: "3 orders",color: "text-blue-600",    bg: "bg-blue-50" },
              ].map((kpi) => (
                <div key={kpi.label} className={`rounded-xl ${kpi.bg} p-4 text-left`}>
                  <p className="text-xs text-slate-500">{kpi.label}</p>
                  <p className={`text-2xl font-bold ${kpi.color} mt-1`}>{kpi.value}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent Stock Movements</div>
                {[
                  { item: "Ribeye Steak (1kg)",    type: "RECEIPT", qty: "+24 kg", color: "text-emerald-600 bg-emerald-50" },
                  { item: "Chardonnay 2022",        type: "ISSUE",   qty: "-6 btl", color: "text-blue-600 bg-blue-50" },
                  { item: "Olive Oil Extra Virgin", type: "WASTAGE", qty: "-2 L",   color: "text-red-600 bg-red-50" },
                ].map((row) => (
                  <div key={row.item} className="flex items-center justify-between border-t border-slate-50 px-4 py-3">
                    <p className="text-sm font-medium text-slate-800">{row.item}</p>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${row.color}`}>{row.type}</span>
                      <span className="text-sm font-bold text-slate-700">{row.qty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-slate-100 bg-slate-50 py-10">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-400">{t.social.trusted}</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {["Grand Palace Hotel", "Bistro Collective", "Cloud Kitchen Co.", "Harbor Catering", "The Vine Group"].map((name) => (
              <span key={name} className="text-sm font-bold text-slate-300">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{t.features.h2}</h2>
          <p className="text-slate-500 max-w-xl mx-auto">{t.features.description}</p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((f, i) => {
            const Icon = featureIcons[i];
            return (
              <div key={f.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${featureColors[i]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-slate-900">{t.testimonials.h2}</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {t.testimonials.items.map((testimonial) => (
              <div key={testimonial.name} className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-4 text-sm text-slate-600 leading-relaxed">"{testimonial.quote}"</p>
                <p className="text-sm font-bold text-slate-900">{testimonial.name}</p>
                <p className="text-xs text-slate-400">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{t.pricing.h2}</h2>
          <p className="text-slate-500">{t.pricing.description}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {t.pricing.plans.map((plan, i) => {
            const highlight = i === 1;
            return (
              <div key={plan.name} className={`relative rounded-2xl p-6 ${highlight ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200 ring-2 ring-indigo-600" : "bg-white border border-slate-200 shadow-sm"}`}>
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-amber-900">{t.pricing.mostPopular}</div>
                )}
                <p className={`text-sm font-semibold ${highlight ? "text-indigo-200" : "text-slate-500"}`}>{plan.name}</p>
                <div className="mt-2 flex items-end gap-1">
                  <span className={`text-4xl font-extrabold ${highlight ? "text-white" : "text-slate-900"}`}>
                    {i === 0 ? "$0" : i === 1 ? "$49" : t.pricing.plans[2].name}
                  </span>
                  <span className={`mb-1 text-sm ${highlight ? "text-indigo-200" : "text-slate-400"}`}>/{plan.period}</span>
                </div>
                <p className={`mt-2 text-sm ${highlight ? "text-indigo-100" : "text-slate-500"}`}>{plan.desc}</p>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${highlight ? "text-indigo-200" : "text-emerald-500"}`} />
                      <span className={highlight ? "text-indigo-50" : "text-slate-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={i === 2 ? "mailto:hello@mise.app" : "/register"}
                  className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${highlight ? "bg-white text-indigo-600 hover:bg-indigo-50" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                >
                  {plan.cta} <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-20 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-4 text-3xl font-extrabold text-white">{t.cta.h2}</h2>
          <p className="mb-8 text-indigo-200">{t.cta.description}</p>
          <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-indigo-600 hover:bg-indigo-50 transition-colors shadow-lg">
            {t.cta.button} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">Mise</span>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Mise. {t.footer.tagline}</p>
          <div className="flex gap-6 text-xs text-slate-400">
            <a href="#" className="hover:text-slate-600">{t.footer.privacy}</a>
            <a href="#" className="hover:text-slate-600">{t.footer.terms}</a>
            <a href="mailto:hello@mise.app" className="hover:text-slate-600">{t.footer.contact}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
