# Mise — Hospitality Inventory Management

A multi-tenant SaaS platform for inventory and operations management across hospitality businesses — hotels, restaurants, bars, cafés, catering companies, and clinics.

**Live:** https://mise-alpha-rose.vercel.app

---

## What it does

- **Inventory tracking** — stock levels by item and location, colour-coded status
- **Stock movements** — receive, issue, transfer, adjust, wastage with full audit trail
- **Purchase orders** — full lifecycle (draft → sent → received), partial receipt support
- **Departments** — organisational structure with exclusive location ownership for P&L accountability
- **Recipes** — ingredient-level costing and yield tracking
- **Requisitions** — cross-department stock requests and approvals
- **Shift handovers** — structured end-of-shift notes and checklists
- **Alerts** — automatic low-stock and out-of-stock notifications
- **Reports** — movement analytics, top-consumed items, category breakdown, wastage trends
- **Audit log** — every action recorded with user, timestamp, and change detail
- **Billing** — Stripe-powered subscription with free trial (PRO tier)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + Radix UI |
| ORM | Prisma 7 with pg adapter |
| Database | PostgreSQL (Supabase) |
| Auth | NextAuth.js v4 |
| Billing | Stripe v18 |
| Email | Resend |
| Deployment | Vercel |

---

## Plans

| Plan | Price | Locations | Users | Items |
|------|-------|-----------|-------|-------|
| Free | $0/mo | 1 | 3 | 50 |
| Pro | $49/mo | 5 | 20 | Unlimited |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited |

Pro includes a 14-day free trial. No card required until trial ends.

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or a Supabase project)

### Setup

```bash
npm install

# Copy and fill in environment variables
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
# Database (Supabase)
DATABASE_URL=postgres://...           # pooled connection (port 6543)
DIRECT_URL=postgres://...             # direct connection (port 5432)

# Auth
NEXTAUTH_SECRET=...                   # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...

# Email (Resend)
RESEND_API_KEY=re_...
ALERT_EMAIL_FROM=noreply@mise.app     # optional, defaults to noreply@mise.app

# Error tracking (Sentry)
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=your-org
SENTRY_PROJECT=mise

# Internal admin dashboard
ADMIN_EMAILS=you@example.com          # comma-separated, access /admin
```

---

## Project Structure

```
app/
  (auth)/          # Login, register pages (public)
  (dashboard)/     # All authenticated app pages — share the dashboard layout
  admin/           # Internal ops dashboard — guarded by ADMIN_EMAILS env var
  api/             # API route handlers
  page.tsx         # Public landing page
  pricing/         # Public pricing page
components/
  ui/              # Primitive UI components (buttons, inputs, etc.)
  layout/          # Sidebar, header, shell
  dashboard/       # Dashboard-specific widgets
  landing/         # Landing page sections
  inventory/       # Inventory-specific components
lib/
  auth.ts          # NextAuth config
  prisma.ts        # Prisma client singleton
  plans.ts         # Plan limits + feature gate helpers
  stripe.ts        # Stripe singleton
  rate-limit.ts    # Edge rate limiting
types/
  index.ts         # SessionUser and shared types
middleware.ts      # Edge auth guard — runs before every protected route
prisma/
  schema.prisma    # Database schema (source of truth)
  migrations/      # Prisma migration history
```

> **Adding a new public route?** Add its path prefix to the `matcher` exclusion regex in `middleware.ts` — otherwise unauthenticated users will be redirected to login.

---

## Branch & PR Workflow

- `main` is the deployable branch — Vercel auto-deploys on push
- Branch off `main` for all changes: `git checkout -b feat/your-feature`
- PR back to `main`; squash merge preferred to keep history clean
- Commit style: conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`)

---

## Tests

No automated test suite yet. Before merging:
1. Run `npm run build` — catches all TypeScript errors (`next dev` does not)
2. Run `npm run lint`
3. Manually test the affected flow end-to-end

---

## Database Schema

| Model | Description |
|-------|-------------|
| Organization | Tenant — owns all data, has plan/billing state |
| User | Team member with role (OWNER, ADMIN, MANAGER, STAFF) |
| Department | Organisational unit owning one or more locations |
| Location | Physical stock location (kitchen, bar, store, ward, etc.) |
| Category | Item grouping |
| Item | Inventory item with SKU, unit, cost |
| InventoryRecord | Stock level per item per location |
| StockMovement | Audit trail of all stock changes |
| Supplier | Vendor contact and PO history |
| PurchaseOrder | Order lifecycle |
| Recipe | Dish/product with costed ingredients |
| Requisition | Cross-department stock request |
| ShiftHandover | End-of-shift structured notes |
| Alert | Low-stock / out-of-stock notifications |
| AuditLog | Full action history |

---

## Deployment (Vercel + Supabase)

1. Create a Supabase project
2. Run `prisma migrate deploy` against your database
3. Add all environment variables to Vercel
4. Create a Stripe product ($49/mo recurring) and webhook endpoint pointing to `/api/stripe/webhook`
5. Deploy

---

## License

Proprietary. Copyright © 2026 Azurion Global Corporation. All rights reserved.
See [LICENSE](./LICENSE) for full terms.
