"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Package, BarChart3, ShoppingCart, Users, Shield, Zap,
  ChevronRight, CheckCircle2, Star, ArrowRight, Globe, ChevronDown, Menu, X,
} from "lucide-react";
import { translations, languages, type Language } from "@/lib/i18n/translations";

const STORAGE_KEY = "mise-lang";
const INTRO_KEY = "mise-intro-ts";
const INTRO_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ─── Language Switcher ────────────────────────────────────────────────────────

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

// ─── Preloader ────────────────────────────────────────────────────────────────

function Preloader({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 450),
      setTimeout(() => setPhase(3), 750),
      setTimeout(() => {
        setLeaving(true);
        onDoneRef.current();
      }, 1950),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950"
      style={{
        transform: leaving ? "translateY(-100%)" : "translateY(0)",
        transition: leaving ? "transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)" : "none",
        pointerEvents: leaving ? "none" : "all",
      }}
    >
      {/* Icon stamp */}
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600 shadow-2xl shadow-indigo-900/60"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "scale(1)" : "scale(0.6)",
          transition: "opacity 0.5s ease-out, transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <Package className="h-10 w-10 text-white" />
      </div>

      {/* Brand name */}
      <div
        className="text-4xl font-extrabold tracking-tight text-white"
        style={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}
      >
        Mise
      </div>

      {/* Tagline */}
      <div
        className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
        style={{
          opacity: phase >= 3 ? 1 : 0,
          transition: "opacity 0.5s ease-out 0.1s",
        }}
      >
        Everything in its place.
      </div>

      {/* Progress sweep */}
      <div className="mt-12 h-px w-36 overflow-hidden rounded-full bg-slate-800">
        <div
          style={{
            width: phase >= 3 ? "100%" : "0%",
            height: "100%",
            background: "linear-gradient(90deg, #6366f1, #818cf8)",
            borderRadius: "9999px",
            transition: phase >= 3 ? "width 1.1s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          }}
        />
      </div>
    </div>
  );
}

// ─── Hero rotating tagline ────────────────────────────────────────────────────

const HERO_PHRASES = [
  "as fast as your service",
  "without the spreadsheets",
  "across every location",
  "with zero surprises",
  "so nothing runs out",
];

function RotatingText() {
  const [idx, setIdx] = useState(0);
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setEntering(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % HERO_PHRASES.length);
        setEntering(true);
      }, 320);
    }, 2800);
    return () => clearInterval(cycle);
  }, []);

  return (
    <span
      className="text-indigo-600"
      style={{
        display: "inline-block",
        opacity: entering ? 1 : 0,
        transform: entering ? "translateY(0)" : "translateY(-10px)",
        transition: "opacity 0.32s ease-out, transform 0.32s ease-out",
      }}
    >
      {HERO_PHRASES[idx]}
    </span>
  );
}

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.65s ease-out ${delay}ms, transform 0.65s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const PLACEHOLDER_ORGS = ["Grand Palace Hotel", "Bistro Collective", "Cloud Kitchen Co.", "Harbor Catering", "The Vine Group"];

export default function LandingPageClient({ trustedOrgs = [] }: { trustedOrgs?: string[] }) {
  const [lang, setLangState] = useState<Language>("en");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [preloaderDone, setPreloaderDone] = useState(false);
  // Start hidden — useEffect decides whether to show based on 24h TTL
  const [showPreloader, setShowPreloader] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && languages.find((l) => l.code === saved)) setLangState(saved);

    const lastSeen = localStorage.getItem(INTRO_KEY);
    const shouldShow = !lastSeen || Date.now() - parseInt(lastSeen, 10) > INTRO_TTL;
    if (shouldShow) {
      setShowPreloader(true); // mount preloader — it will call onDone when done
    } else {
      setPreloaderDone(true); // skip preloader, let hero animate in immediately
    }
  }, []);

  const handlePreloaderDone = useCallback(() => {
    localStorage.setItem(INTRO_KEY, Date.now().toString());
    setPreloaderDone(true);
    setTimeout(() => setShowPreloader(false), 800);
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

  // Hero elements fade-up in cascade after preloader exits
  function heroStyle(delay: number): React.CSSProperties {
    return {
      opacity: preloaderDone ? 1 : 0,
      transform: preloaderDone ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.65s ease-out ${delay}ms, transform 0.65s ease-out ${delay}ms`,
    };
  }

  return (
    <>
      {showPreloader && <Preloader onDone={handlePreloaderDone} />}

      <div className="min-h-screen bg-white text-slate-900" dir={dir}>
        {/* Nav */}
        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">Mise</span>
            </div>

            <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
              <a href="#features"     className="hover:text-slate-900 transition-colors">{t.nav.features}</a>
              <a href="#pricing"      className="hover:text-slate-900 transition-colors">{t.nav.pricing}</a>
              <a href="#testimonials" className="hover:text-slate-900 transition-colors">{t.nav.customers}</a>
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                {t.nav.signIn}
              </Link>
              <Link href="/register" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                {t.nav.startFree}
              </Link>
              <LanguageSwitcher lang={lang} setLang={setLang} />
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <LanguageSwitcher lang={lang} setLang={setLang} />
              <button
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-colors"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 md:hidden">
              <nav className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                <a href="#features"     onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 transition-colors">{t.nav.features}</a>
                <a href="#pricing"      onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 transition-colors">{t.nav.pricing}</a>
                <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-slate-50 hover:text-slate-900 transition-colors">{t.nav.customers}</a>
              </nav>
              <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  {t.nav.signIn}
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                  {t.nav.startFree}
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 to-white px-4 pb-16 pt-14 text-center sm:px-6 sm:pb-24 sm:pt-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-4xl">
            <div style={heroStyle(0)} className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700">
              <Zap className="h-3.5 w-3.5" />
              {t.hero.badge}
            </div>
            <div style={heroStyle(110)}>
              <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                {t.hero.h1Line1}
                <br />
                <RotatingText />
              </h1>
            </div>
            <div style={heroStyle(230)}>
              <p className="mx-auto mb-10 max-w-2xl text-base text-slate-500 sm:text-lg">{t.hero.description}</p>
            </div>
            <div style={heroStyle(350)} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/register" className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:shadow-indigo-300">
                {t.hero.ctaPrimary} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all">
                {t.hero.ctaSecondary}
              </Link>
            </div>
            <div style={heroStyle(420)}>
              <p className="mt-4 text-xs text-slate-400">{t.hero.note}</p>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div style={heroStyle(540)} className="relative mx-auto mt-16 max-w-5xl">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/80">
              <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-slate-400">mise.app/inventory</span>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:gap-4 sm:p-6">
                {[
                  { label: "Stock Value",      value: "$48,320",  color: "text-indigo-600",  bg: "bg-indigo-50" },
                  { label: "Low Stock Alerts", value: "7 items",  color: "text-amber-600",   bg: "bg-amber-50" },
                  { label: "Units Received",   value: "1,284",    color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Open POs",         value: "3 orders", color: "text-blue-600",    bg: "bg-blue-50" },
                ].map((kpi) => (
                  <div key={kpi.label} className={`rounded-xl ${kpi.bg} p-4 text-left`}>
                    <p className="text-xs text-slate-500">{kpi.label}</p>
                    <p className={`mt-1 text-lg font-bold sm:text-2xl ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <div className="bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Recent Stock Movements
                  </div>
                  {[
                    { item: "Ribeye Steak (1kg)",    type: "RECEIPT", qty: "+24 kg", color: "text-emerald-600 bg-emerald-50" },
                    { item: "Chardonnay 2022",        type: "ISSUE",   qty: "-6 btl", color: "text-blue-600 bg-blue-50" },
                    { item: "Olive Oil Extra Virgin", type: "WASTAGE", qty: "-2 L",   color: "text-red-600 bg-red-50" },
                  ].map((row) => (
                    <div key={row.item} className="flex items-center justify-between gap-3 border-t border-slate-50 px-4 py-3">
                      <p className="min-w-0 truncate text-sm font-medium text-slate-800">{row.item}</p>
                      <div className="flex shrink-0 items-center gap-3">
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
          <Reveal className="mx-auto max-w-4xl px-6 text-center">
            <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-400">{t.social.trusted}</p>
            {(() => {
              const display = trustedOrgs.length >= 3
                ? trustedOrgs
                : [...trustedOrgs, ...PLACEHOLDER_ORGS].slice(0, 5);
              const doubled = [...display, ...display];
              return trustedOrgs.length >= 8 ? (
                <div className="overflow-hidden">
                  <div
                    className="flex gap-12 whitespace-nowrap"
                    style={{ animation: "marquee 22s linear infinite" }}
                  >
                    {doubled.map((name, i) => (
                      <span key={i} className="text-sm font-bold text-slate-300">{name}</span>
                    ))}
                  </div>
                  <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-8">
                  {display.map((name, i) => (
                    <span key={i} className="text-sm font-bold text-slate-300">{name}</span>
                  ))}
                </div>
              );
            })()}
          </Reveal>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-extrabold text-slate-900">{t.features.h2}</h2>
            <p className="mx-auto max-w-xl text-slate-500">{t.features.description}</p>
          </Reveal>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {t.features.items.map((f, i) => {
              const Icon = featureIcons[i];
              return (
                <Reveal key={f.title} delay={i * 80}>
                  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${featureColors[i]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 text-base font-bold text-slate-900">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="bg-slate-50 py-24">
          <div className="mx-auto max-w-5xl px-6">
            <Reveal>
              <h2 className="mb-12 text-center text-3xl font-extrabold text-slate-900">{t.testimonials.h2}</h2>
            </Reveal>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {t.testimonials.items.map((testimonial, i) => (
                <Reveal key={testimonial.name} delay={i * 110}>
                  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-slate-600">"{testimonial.quote}"</p>
                    <p className="text-sm font-bold text-slate-900">{testimonial.name}</p>
                    <p className="text-xs text-slate-400">{testimonial.role}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-5xl px-6 py-24">
          <Reveal className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-extrabold text-slate-900">{t.pricing.h2}</h2>
            <p className="text-slate-500">{t.pricing.description}</p>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {t.pricing.plans.map((plan, i) => {
              const highlight = i === 1;
              return (
                <Reveal key={plan.name} delay={i * 110}>
                  <div className={`relative rounded-2xl p-6 ${highlight ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200 ring-2 ring-indigo-600" : "border border-slate-200 bg-white shadow-sm"}`}>
                    {highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-amber-900">
                        {t.pricing.mostPopular}
                      </div>
                    )}
                    <p className={`text-sm font-semibold ${highlight ? "text-indigo-200" : "text-slate-500"}`}>{plan.name}</p>
                    <div className="mt-2 flex items-end gap-1">
                      <span className={`text-4xl font-extrabold ${highlight ? "text-white" : "text-slate-900"}`}>
                        {i === 0 ? "$0" : i === 1 ? "$49" : "Custom"}
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
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-indigo-600 py-20 text-center">
          <Reveal className="mx-auto max-w-2xl px-6">
            <h2 className="mb-4 text-3xl font-extrabold text-white">{t.cta.h2}</h2>
            <p className="mb-8 text-indigo-200">{t.cta.description}</p>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-indigo-600 shadow-lg transition-colors hover:bg-indigo-50">
              {t.cta.button} <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
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
    </>
  );
}
