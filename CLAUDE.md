@AGENTS.md

# Mise — AI Session Reference

This file is the living source of truth for AI-assisted development sessions.
Update it whenever significant decisions, architecture changes, or roadmap shifts occur.

---

## Project Overview

**Mise** is a multi-tenant SaaS inventory management platform built for hospitality businesses —
hotels, restaurants, bars, cafés, catering companies, and clinics.

**Business goal:** Beat existing systems not just on features, but on ease of use, onboarding
speed, security, and operational clarity. Primary selling points: security-first architecture,
frictionless onboarding, and intuitive navigation for low-tech users.

**Parent company strategy (V3):** Mise will be one product under a larger Solution providing
company with its own standalone website, enabling multiple industry solutions under one umbrella.

**Live URL:** https://mise-alpha-rose.vercel.app
**Repo:** sonofralph/sonofralph
**Active branch:** claude/session-01hqwmf6xyidpjzuemja98au-jwxply

---

## Decision Framework — Six Lenses

Every feature and decision is evaluated through these six lenses in order:

1. **Business** — revenue impact, market positioning, competitive advantage
2. **Development & Security** — implementation complexity, security posture, technical debt
3. **Marketing Expert** — does this move the needle on acquisition, retention, or perception? would a growth marketer fight for this feature?
4. **Customer / Client / End User** — ease of use, low-tech accessibility, workflow fit
5. **Product** — does it make the product coherent and complete?
6. **Investor / Acquirer** — would this make the business more valuable or attractive to acquire?

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.2.9 |
| Language | TypeScript (strict mode) | 5.x |
| UI | Tailwind CSS v4 + Radix UI primitives | 4.x |
| ORM | Prisma with `@prisma/adapter-pg` | 7.8.0 |
| Database | Supabase (PostgreSQL) | — |
| Auth | NextAuth.js v4 (credentials + JWT) | 4.24.x |
| Validation | Zod v4 | 4.4.3 |
| Billing | Stripe v18 | 18.x |
| Email | Resend | 6.x |
| Icons | lucide-react | 1.21.0 |
| Charts | Recharts | 3.x |
| Deployment | Vercel | — |

**Critical notes:**
- `next build` runs full TypeScript — `next dev` does NOT. Always test with build before deploying.
- Zod v4 has breaking changes from v3. Use `z.enum(VALUES as const)` pattern.
- lucide-react v1.21.0 — only use icons confirmed to exist in the codebase. Never guess icon names.
- `Record<UnionType, ...>` must be exhaustive. Use `Partial<Record<...>>` if not all keys covered.
- Prisma config lives in `prisma.config.ts`, not `schema.prisma` options block.

---

## Architecture

### Multi-tenancy
Every query is scoped by `organizationId`. No cross-org data leakage is acceptable.
`session.user.organizationId` is the source of truth, always from server-side session.

### Auth flow
NextAuth credentials provider → JWT session → `SessionUser` type carries
`id`, `email`, `name`, `role`, `organizationId`, `organizationName`.

### Plan system
Three tiers defined in `lib/plans.ts`:
- **FREE** — 1 location, 3 users, 50 items, $0
- **PRO** — 5 locations, 20 users, unlimited items, $49/mo (14-day trial)
- **ENTERPRISE** — unlimited everything, custom pricing

Plan status: `ACTIVE | TRIALING | PAST_DUE | CANCELLED`

### Stripe billing
- Checkout: `POST /api/stripe/checkout` — creates session with 14-day trial
- Portal: `POST /api/stripe/portal` — self-serve plan management
- Webhook: `POST /api/stripe/webhook` — syncs subscription state to DB
- Customer ID stored on `Organization.stripeCustomerId`

### Department model
Departments **own** locations exclusively (one location → one department) for P&L accountability.
Cross-department stock access happens via requisitions/transfers, not shared ownership.

---

## Database — Supabase Project

**Project:** `mise` (AWS eu-west-1)
**App tables confirmed in:** `mise` project (not `sonofralph's Project`)

Run migrations in the `mise` project SQL editor, never the other one.

---

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema — source of truth |
| `lib/plans.ts` | Plan limits, PLAN_LIMITS constant, isActive() helper |
| `lib/stripe.ts` | Stripe singleton + STRIPE_PRICES |
| `lib/auth.ts` | NextAuth config |
| `lib/prisma.ts` | Prisma client singleton |
| `types/index.ts` | SessionUser and shared types |
| `app/(dashboard)/onboarding/OnboardingWizard.tsx` | 5-step onboarding wizard |
| `app/api/stripe/webhook/route.ts` | Stripe lifecycle webhook handler |
| `components/layout/Sidebar.tsx` | Nav — role-gated menu items |

---

## Onboarding Wizard — 5 Steps

0. **Business type** — Restaurant, Hotel, Bar, Café, Catering, Clinic
1. **Size** — SMALL (Free), GROWING (Pro + trial), ENTERPRISE (custom)
2. **Locations** — preset suggestions based on business type
3. **Items** — seed initial inventory
4. **Done** → GROWING orgs redirect to Stripe checkout; others to `/go-live`

---

## Environment Variables

### Vercel (production)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooled connection (port 6543) |
| `DIRECT_URL` | Supabase direct connection (port 5432) |
| `NEXTAUTH_SECRET` | JWT signing secret |
| `NEXTAUTH_URL` | https://mise-alpha-rose.vercel.app |
| `STRIPE_SECRET_KEY` | Stripe secret (`sk_test_...` for test mode) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | `price_1TnLcLH1OwMEblijC4kI4tAI` |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `ALERT_EMAIL_FROM` | Sending address — default `noreply@mise.app` |
| `SENTRY_DSN` | Sentry project DSN (from sentry.io project settings) |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source map uploads on Vercel |

---

## Build Versions & Status

### V1 — Core Inventory (SHIPPED ✅)
- Multi-tenant auth and org setup
- Locations, items, inventory records
- Stock movements (receive, issue, transfer, adjust, waste)
- Purchase orders (draft → sent → received, partial receipt)
- Suppliers, categories
- Departments with exclusive location ownership
- Alerts (low stock, out of stock)
- Reports and analytics
- Audit log
- Recipes and expiry tracking
- Shift handovers
- Requisitions
- Go-live checklist

### V1.1 — Billing + Onboarding (SHIPPED ✅)
- [x] Stripe integration (checkout, portal, webhook)
- [x] Plan limits defined in `lib/plans.ts`
- [x] Org size step in onboarding wizard
- [x] Billing fields migration (planStatus, orgSize, stripeCustomerId, etc.)
- [x] Feature gates — enforce plan limits on location/user/item creation APIs
- [x] `/settings/billing` page — show plan, upgrade button, portal link
- [x] Public pricing page (`/pricing`)
- [x] Rate limiting on API routes (`lib/rate-limit.ts`)
- [x] Email delivery via Resend — invite emails + alert rebrand to Mise
- [x] Pagination on large list views — movements (50/page), audit (100/page)
- [x] GDPR — data export (`GET /api/gdpr/export`) and account deletion (`POST /api/gdpr/delete`)
- [ ] Sentry error tracking ← NEXT

### V2 — Intelligence & Scale (PLANNED)
- AI-assisted demand forecasting
- Automated reorder suggestions
- Supplier price comparison
- CSV bulk import/export
- Mobile-optimised views
- Webhook integrations (POS systems, accounting)
- White-label / custom branding per org
- SSO (SAML/OAuth for enterprise)
- Advanced reporting (cost of goods, wastage trends)

### V3 — Platform & Parent Company (FUTURE)
- Mise becomes one product under a parent Solution company
- Parent company standalone website
- Multiple industry verticals (retail, healthcare, education)
- Marketplace for integrations
- Partner/reseller programme

---

## GTM & Launch Strategy — DELIVER BEFORE GO-LIVE 🚨

**Formally tracked. Must be delivered before any paid marketing or public launch.**

### The core problem
Distribution is the #1 reason SaaS products fail — not product quality.
A great product at $49/mo means nothing if the target customer never finds it.
Current estimated success probability: 30–40%. Target: 70%+.

### What needs to be answered before launch
- Primary lead channel (one, not five — go deep before going wide)
- Ideal Customer Profile: which sub-vertical, what size, what geography first
- Positioning: why Mise over the incumbent they're already using (or not using)
- First 10 customers plan: who, how, by when
- Pricing page live and converting before any paid marketing
- Partnership targets: hospitality accountants, POS vendors, industry associations
- Content/SEO strategy: who is searching for this and what terms

### Why distribution beats product
Mise V1 already has feature parity or better vs most SMB competitors.
The gap is not features — it's awareness and trust.
The 30→70% move is entirely a GTM execution problem, not a build problem.

**ACTION: Deliver full detailed GTM playbook once V1.1 + Sentry are complete. Covers: ICP, primary channel, positioning, first 10 customers, partnership targets, SEO/content, pricing page conversion. Goal: 30–40% → 70%+ success probability.**

---

## Conventions

- All API routes validate session first, then role, then input (Zod), then DB
- `organizationId` always comes from session, never from request body
- Server components fetch data; client components handle interaction
- No `any` types except where Stripe/NextAuth force it
- Icons: only use names confirmed to exist in codebase. When in doubt, grep first.
- Migrations: write as `ADD COLUMN IF NOT EXISTS` for safety
- Commits: conventional commits style (`feat`, `fix`, `chore`, etc.)

---

## Lessons Learned

- `next dev` skips TypeScript — always run `npm run build` to catch type errors before pushing
- When extending a union type in the schema, grep for `Record<ThatType` to find all dependent records
- Supabase has two projects (`mise` and `sonofralph's Project`) — app tables are in `mise`
- Stripe Workbench uses a new v2 events UI — it's the same as the old "Add endpoint" flow
- Test mode is correct for development — don't switch to live mode until pre-launch
- The Stripe account is under "Azurion Global Corporation" — update to Mise entity before go-live
