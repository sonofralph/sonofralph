# Stockwise — Hospitality Inventory Management System

A multi-tenant, production-ready SaaS inventory management platform built for hotels, restaurants, bars, and hospitality businesses.

## Features

- **Multi-tenant** — isolated organizations, each with their own data
- **Role-based access control** — Owner, Admin, Manager, Staff
- **Inventory tracking** — stock levels by item and location, with color-coded status
- **Stock movements** — receipt, issue, transfer, adjustment, wastage with full audit trail
- **Purchase orders** — create, send, receive (partial/full), auto-update inventory
- **Supplier management** — contact directory with PO history
- **Location management** — hotel, restaurant, bar, kitchen, warehouse, event space
- **Alerts** — automatic low-stock and out-of-stock notifications
- **Reports** — movement analytics, top-consumed items, category breakdown
- **Self-hostable** — Docker + docker-compose for on-premise deployment

## Stack

- **Next.js 14** (App Router, Server Components)
- **TypeScript** — strict end-to-end types
- **Tailwind CSS** + **shadcn/ui** components
- **Prisma ORM** (v7 with pg adapter)
- **NextAuth.js** (credentials provider, JWT sessions)
- **Supabase** (optional — SaaS deployment path)
- **Docker** + **docker-compose**
- **Zod** — API validation

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ running locally (or use Docker)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Credentials

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Owner   | owner@grandhotel.com   | password123 |
| Manager | manager@grandhotel.com | password123 |
| Staff   | staff@grandhotel.com   | password123 |

## Docker Deployment (Self-Hosted)

```bash
# Copy and configure environment
cp .env.example .env
# Set NEXTAUTH_SECRET (generate: openssl rand -base64 32)
# Set POSTGRES_PASSWORD

# Build and start
docker compose up -d

# The app will auto-run migrations on startup
```

Access at [http://localhost:3000](http://localhost:3000).

## Supabase Deployment (SaaS)

1. Create a Supabase project
2. Run the migration: `supabase/migrations/20240101000000_initial_schema.sql`
3. Configure env vars for your Supabase project
4. Deploy to Vercel/Railway/Fly.io

## Database Schema

| Model             | Description                                        |
|-------------------|----------------------------------------------------|
| Organization      | Tenant — hotel chain, restaurant group, etc.       |
| User              | Team member with role                              |
| Location          | Hotel, restaurant, bar, kitchen, warehouse, etc.   |
| Category          | Item grouping (Beverages, Linens, etc.)            |
| Item              | Inventory item with SKU                            |
| InventoryRecord   | Stock level per item per location                  |
| StockMovement     | Audit trail of all stock changes                   |
| Supplier          | Vendor contact information                         |
| PurchaseOrder     | Order lifecycle (draft -> sent -> received)        |
| PurchaseOrderLine | Line items on a PO                                 |
| Alert             | Low-stock / out-of-stock notifications             |

## License

MIT
