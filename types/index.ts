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
  UserRole,
  LocationType,
  MovementType,
  POStatus,
  AlertType,
  AlertStatus,
  Plan,
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
  UserRole,
  LocationType,
  MovementType,
  POStatus,
  AlertType,
  AlertStatus,
  Plan,
};

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
  role: UserRole;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
};
