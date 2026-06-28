import {
  Organization,
  User,
  Location,
  Category,
  Item,
  InventoryRecord,
  StockMovement,
  Supplier,
  PurchaseOrder,
  PurchaseOrderLine,
  Alert,
} from "@prisma/client";

export type {
  Organization,
  User,
  Location,
  Category,
  Item,
  InventoryRecord,
  StockMovement,
  Supplier,
  PurchaseOrder,
  PurchaseOrderLine,
  Alert,
};

export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "STAFF";
export type LocationType = "HOTEL" | "RESTAURANT" | "BAR" | "KITCHEN" | "WAREHOUSE" | "EVENT_SPACE" | "HOUSEKEEPING" | "LAUNDRY" | "CELLAR" | "STORAGE" | "FREEZER" | "PHARMACY" | "WARD" | "OTHER";
export type MovementType = "RECEIPT" | "ISSUE" | "TRANSFER" | "ADJUSTMENT" | "WASTAGE";
export type POStatus = "DRAFT" | "SENT" | "PARTIAL" | "RECEIVED" | "CANCELLED";
export type AlertType = "LOW_STOCK" | "OUT_OF_STOCK" | "EXPIRY";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
export type Plan = "FREE" | "PRO" | "ENTERPRISE";

export type InventoryWithRelations = InventoryRecord & {
  item: Item & { category: Category };
  location: Location;
};

export type MovementWithRelations = StockMovement & {
  item: Item;
  location: Location;
  user: Pick<User, "id" | "name" | "email">;
};

export type POWithRelations = PurchaseOrder & {
  supplier: Supplier;
  lines: (PurchaseOrderLine & { item: Item })[];
};

export type AlertWithRelations = Alert & {
  item: Item;
  location: Location;
};

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  jobTitle?: string | null;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
};
