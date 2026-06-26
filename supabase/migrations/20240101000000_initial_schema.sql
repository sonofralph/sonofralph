-- ============================================================
-- Stockwise — Initial Schema Migration
-- Mirrors the Prisma schema for Supabase SaaS path
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
CREATE TYPE "DeploymentMode" AS ENUM ('SAAS', 'SELF_HOSTED');
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'STAFF');
CREATE TYPE "LocationType" AS ENUM ('HOTEL', 'RESTAURANT', 'BAR', 'KITCHEN', 'WAREHOUSE', 'EVENT_SPACE');
CREATE TYPE "MovementType" AS ENUM ('RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'WASTAGE');
CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'CANCELLED');
CREATE TYPE "AlertType" AS ENUM ('LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRY');
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- Organizations (tenants)
CREATE TABLE "Organization" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan "Plan" NOT NULL DEFAULT 'FREE',
  "deploymentMode" "DeploymentMode" NOT NULL DEFAULT 'SAAS',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  "passwordHash" TEXT,
  role "UserRole" NOT NULL DEFAULT 'STAFF',
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Locations
CREATE TABLE "Location" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  type "LocationType" NOT NULL,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE "Category" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items
CREATE TABLE "Item" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "categoryId" TEXT NOT NULL REFERENCES "Category"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sku, "organizationId")
);

-- Inventory Records
CREATE TABLE "InventoryRecord" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "itemId" TEXT NOT NULL REFERENCES "Item"(id) ON DELETE CASCADE,
  "locationId" TEXT NOT NULL REFERENCES "Location"(id) ON DELETE CASCADE,
  quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
  "minStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxStock" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "reorderPoint" DOUBLE PRECISION NOT NULL DEFAULT 10,
  "lastUpdated" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("itemId", "locationId")
);

-- Stock Movements
CREATE TABLE "StockMovement" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "itemId" TEXT NOT NULL REFERENCES "Item"(id) ON DELETE CASCADE,
  "locationId" TEXT NOT NULL REFERENCES "Location"(id) ON DELETE CASCADE,
  type "MovementType" NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  reference TEXT,
  notes TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suppliers
CREATE TABLE "Supplier" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE "PurchaseOrder" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "supplierId" TEXT NOT NULL REFERENCES "Supplier"(id),
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  status "POStatus" NOT NULL DEFAULT 'DRAFT',
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  notes TEXT,
  "orderDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expectedDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase Order Lines
CREATE TABLE "PurchaseOrderLine" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "purchaseOrderId" TEXT NOT NULL REFERENCES "PurchaseOrder"(id) ON DELETE CASCADE,
  "itemId" TEXT NOT NULL REFERENCES "Item"(id),
  quantity DOUBLE PRECISION NOT NULL,
  "unitCost" DOUBLE PRECISION NOT NULL,
  "receivedQty" DOUBLE PRECISION NOT NULL DEFAULT 0
);

-- Alerts
CREATE TABLE "Alert" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "itemId" TEXT NOT NULL REFERENCES "Item"(id),
  "locationId" TEXT NOT NULL REFERENCES "Location"(id),
  type "AlertType" NOT NULL,
  status "AlertStatus" NOT NULL DEFAULT 'OPEN',
  message TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_user_org ON "User"("organizationId");
CREATE INDEX idx_location_org ON "Location"("organizationId");
CREATE INDEX idx_item_org ON "Item"("organizationId");
CREATE INDEX idx_item_category ON "Item"("categoryId");
CREATE INDEX idx_inventory_item ON "InventoryRecord"("itemId");
CREATE INDEX idx_inventory_location ON "InventoryRecord"("locationId");
CREATE INDEX idx_movement_item ON "StockMovement"("itemId");
CREATE INDEX idx_movement_created ON "StockMovement"("createdAt" DESC);
CREATE INDEX idx_po_org ON "PurchaseOrder"("organizationId");
CREATE INDEX idx_alert_org ON "Alert"("organizationId");
CREATE INDEX idx_alert_status ON "Alert"(status);

-- Row Level Security (for Supabase multi-tenancy)
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseOrderLine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Alert" ENABLE ROW LEVEL SECURITY;

-- Auto-update updatedAt via trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organization_updated_at BEFORE UPDATE ON "Organization"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_location_updated_at BEFORE UPDATE ON "Location"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_item_updated_at BEFORE UPDATE ON "Item"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_po_updated_at BEFORE UPDATE ON "PurchaseOrder"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_alert_updated_at BEFORE UPDATE ON "Alert"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
