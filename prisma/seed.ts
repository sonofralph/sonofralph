import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new (require("@prisma/adapter-pg").PrismaPg)({
    connectionString: process.env.DATABASE_URL ?? "postgresql://stockwise:stockwise123@localhost:5432/stockwise",
  }),
});

async function main() {
  console.log("Seeding database...");

  // Create organization
  const org = await prisma.organization.upsert({
    where: { slug: "grand-hotel-suites" },
    update: {},
    create: {
      name: "Grand Hotel & Suites",
      slug: "grand-hotel-suites",
      plan: "PRO",
      deploymentMode: "SAAS",
    },
  });

  // Create users
  const passwordHash = await bcrypt.hash("password123", 12);

  const owner = await prisma.user.upsert({
    where: { email: "owner@grandhotel.com" },
    update: {},
    create: {
      email: "owner@grandhotel.com",
      name: "Alexandra Chen",
      passwordHash,
      role: "OWNER",
      organizationId: org.id,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@grandhotel.com" },
    update: {},
    create: {
      email: "manager@grandhotel.com",
      name: "Marcus Johnson",
      passwordHash,
      role: "MANAGER",
      organizationId: org.id,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@grandhotel.com" },
    update: {},
    create: {
      email: "staff@grandhotel.com",
      name: "Sophie Williams",
      passwordHash,
      role: "STAFF",
      organizationId: org.id,
    },
  });

  // Create locations
  const [mainKitchen, mainBar, mainWarehouse] = await Promise.all([
    prisma.location.upsert({
      where: { id: "loc-kitchen-001" },
      update: {},
      create: {
        id: "loc-kitchen-001",
        name: "Main Kitchen",
        type: "KITCHEN",
        organizationId: org.id,
      },
    }),
    prisma.location.upsert({
      where: { id: "loc-bar-001" },
      update: {},
      create: {
        id: "loc-bar-001",
        name: "Grand Bar",
        type: "BAR",
        organizationId: org.id,
      },
    }),
    prisma.location.upsert({
      where: { id: "loc-warehouse-001" },
      update: {},
      create: {
        id: "loc-warehouse-001",
        name: "Central Warehouse",
        type: "WAREHOUSE",
        organizationId: org.id,
      },
    }),
  ]);

  // Create categories
  const categoryData = [
    "Beverages",
    "Dry Goods",
    "Produce",
    "Dairy & Eggs",
    "Meat & Seafood",
    "Cleaning Supplies",
    "Linens & Textiles",
    "Kitchen Equipment",
  ];

  const categories: Record<string, string> = {};
  for (const name of categoryData) {
    const cat = await prisma.category.upsert({
      where: { id: `cat-${name.toLowerCase().replace(/[^a-z]/g, "-")}` },
      update: {},
      create: {
        id: `cat-${name.toLowerCase().replace(/[^a-z]/g, "-")}`,
        name,
        organizationId: org.id,
      },
    });
    categories[name] = cat.id;
  }

  // Create suppliers
  const [supplier1, supplier2, supplier3] = await Promise.all([
    prisma.supplier.upsert({
      where: { id: "sup-001" },
      update: {},
      create: {
        id: "sup-001",
        name: "Metro Food Distributors",
        contact: "Robert Kim",
        email: "orders@metrofood.com",
        phone: "+1 555 100 2000",
        address: "100 Distribution Ave, Chicago, IL 60601",
        organizationId: org.id,
      },
    }),
    prisma.supplier.upsert({
      where: { id: "sup-002" },
      update: {},
      create: {
        id: "sup-002",
        name: "Premium Beverage Supply Co",
        contact: "Lisa Torres",
        email: "orders@premiumbev.com",
        phone: "+1 555 200 3000",
        address: "200 Spirits Lane, Chicago, IL 60602",
        organizationId: org.id,
      },
    }),
    prisma.supplier.upsert({
      where: { id: "sup-003" },
      update: {},
      create: {
        id: "sup-003",
        name: "CleanPro Hospitality Supplies",
        contact: "David Lee",
        email: "sales@cleanpro.com",
        phone: "+1 555 300 4000",
        address: "300 Clean St, Chicago, IL 60603",
        organizationId: org.id,
      },
    }),
  ]);

  // Items seed data: [name, sku, unit, category, desc]
  const itemsData = [
    // Beverages
    ["Sparkling Water 500ml", "BEV-001", "case", "Beverages", "24 bottles per case"],
    ["Orange Juice 1L", "BEV-002", "case", "Beverages", "12 cartons per case"],
    ["Cabernet Sauvignon", "BEV-003", "bottle", "Beverages", "House red wine"],
    ["Chardonnay", "BEV-004", "bottle", "Beverages", "House white wine"],
    ["Premium Vodka", "BEV-005", "bottle", "Beverages", "750ml premium vodka"],
    ["Craft Beer IPA", "BEV-006", "keg", "Beverages", "30L keg"],
    ["Espresso Beans", "BEV-007", "kg", "Beverages", "Single-origin Arabica"],

    // Dry Goods
    ["All-Purpose Flour", "DRY-001", "kg", "Dry Goods", "25kg bulk bag"],
    ["Basmati Rice", "DRY-002", "kg", "Dry Goods", "Premium long-grain"],
    ["Pasta Penne", "DRY-003", "kg", "Dry Goods", "Durum wheat penne"],
    ["Sugar White", "DRY-004", "kg", "Dry Goods", "Granulated white sugar"],
    ["Olive Oil Extra Virgin", "DRY-005", "litre", "Dry Goods", "Cold-pressed EVOO"],
    ["Kosher Salt", "DRY-006", "kg", "Dry Goods", "Coarse kosher salt"],

    // Produce
    ["Tomatoes Roma", "PRD-001", "kg", "Produce", "Fresh roma tomatoes"],
    ["Lettuce Iceberg", "PRD-002", "head", "Produce", "Fresh iceberg lettuce"],
    ["Yellow Onions", "PRD-003", "kg", "Produce", "Fresh yellow onions"],
    ["Garlic Fresh", "PRD-004", "kg", "Produce", "Fresh whole garlic bulbs"],
    ["Lemons", "PRD-005", "kg", "Produce", "Fresh lemons"],
    ["Mixed Herbs", "PRD-006", "bunch", "Produce", "Parsley, thyme, rosemary mix"],

    // Dairy & Eggs
    ["Whole Milk", "DAI-001", "litre", "Dairy & Eggs", "Fresh whole milk"],
    ["Heavy Cream", "DAI-002", "litre", "Dairy & Eggs", "35% fat heavy cream"],
    ["Unsalted Butter", "DAI-003", "kg", "Dairy & Eggs", "Premium unsalted butter"],
    ["Eggs Large", "DAI-004", "dozen", "Dairy & Eggs", "Free-range large eggs"],
    ["Parmesan Cheese", "DAI-005", "kg", "Dairy & Eggs", "Aged Parmigiano-Reggiano"],

    // Meat & Seafood
    ["Beef Tenderloin", "MEA-001", "kg", "Meat & Seafood", "USDA Prime beef tenderloin"],
    ["Chicken Breast", "MEA-002", "kg", "Meat & Seafood", "Boneless skinless chicken breast"],
    ["Atlantic Salmon", "MEA-003", "kg", "Meat & Seafood", "Fresh Atlantic salmon fillet"],
    ["Shrimp 16/20", "MEA-004", "kg", "Meat & Seafood", "Frozen peeled deveined shrimp"],

    // Cleaning Supplies
    ["All-Purpose Cleaner", "CLN-001", "bottle", "Cleaning Supplies", "5L commercial cleaner"],
    ["Dish Soap Commercial", "CLN-002", "litre", "Cleaning Supplies", "Commercial-grade dish soap"],
    ["Sanitizing Wipes", "CLN-003", "pack", "Cleaning Supplies", "200 wipes per pack"],
    ["Latex Gloves Medium", "CLN-004", "box", "Cleaning Supplies", "100 gloves per box"],
    ["Trash Bags 55gal", "CLN-005", "roll", "Cleaning Supplies", "25 bags per roll"],

    // Linens & Textiles
    ["King Bed Sheets White", "LIN-001", "set", "Linens & Textiles", "400 thread count Egyptian cotton"],
    ["Bath Towels White", "LIN-002", "each", "Linens & Textiles", "Premium hotel towel 600gsm"],
    ["Table Napkins Linen", "LIN-003", "each", "Linens & Textiles", "White linen dinner napkins"],
    ["Tablecloths 60x120", "LIN-004", "each", "Linens & Textiles", "White cotton tablecloth"],

    // Kitchen Equipment
    ["Chef Knife 10-inch", "EQP-001", "each", "Kitchen Equipment", "Professional chef knife"],
    ["Cutting Board Large", "EQP-002", "each", "Kitchen Equipment", "NSF certified poly board"],
    ["Mixing Bowls Set", "EQP-003", "set", "Kitchen Equipment", "Stainless steel 3-piece set"],
    ["Sheet Pan Half", "EQP-004", "each", "Kitchen Equipment", "18x13 aluminum sheet pan"],
    ["Hotel Pan 1/2 Size", "EQP-005", "each", "Kitchen Equipment", "Stainless steel steam table pan"],
    ["Squeeze Bottles", "EQP-006", "each", "Kitchen Equipment", "Clear squeeze bottles 16oz"],
    ["Thermometer Digital", "EQP-007", "each", "Kitchen Equipment", "Instant-read digital thermometer"],
    ["Plastic Food Wrap", "EQP-008", "roll", "Kitchen Equipment", "18-inch commercial cling wrap"],
  ];

  const locations = [mainKitchen, mainBar, mainWarehouse];
  const locationCycle = [mainWarehouse, mainBar, mainKitchen];

  for (let i = 0; i < itemsData.length; i++) {
    const [name, sku, unit, category, description] = itemsData[i] as string[];
    const catId = categories[category];
    const location = locationCycle[i % 3];

    const minStock = Math.floor(Math.random() * 5) + 2;
    const reorderPoint = minStock + Math.floor(Math.random() * 10) + 5;
    const maxStock = reorderPoint + Math.floor(Math.random() * 50) + 20;
    // Some items intentionally below reorder point for demo
    const quantity = i % 7 === 0
      ? Math.floor(Math.random() * minStock) // critical
      : i % 5 === 0
      ? Math.floor(Math.random() * (reorderPoint - minStock)) + minStock // low
      : Math.floor(Math.random() * (maxStock - reorderPoint)) + reorderPoint; // ok

    const item = await prisma.item.upsert({
      where: { sku_organizationId: { sku, organizationId: org.id } },
      update: {},
      create: {
        name,
        sku,
        description,
        unit,
        organizationId: org.id,
        categoryId: catId,
      },
    });

    await prisma.inventoryRecord.upsert({
      where: {
        itemId_locationId: { itemId: item.id, locationId: location.id },
      },
      update: { quantity },
      create: {
        itemId: item.id,
        locationId: location.id,
        quantity,
        minStock,
        maxStock,
        reorderPoint,
        lastUpdated: new Date(),
      },
    });

    // Add some sample movements
    const movementTypes = ["RECEIPT", "ISSUE", "WASTAGE"] as const;
    for (let j = 0; j < 3; j++) {
      const type = movementTypes[j % 3];
      await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          locationId: location.id,
          type,
          quantity: Math.floor(Math.random() * 20) + 1,
          reference: type === "RECEIPT" ? `PO-2024-${String(i + 1).padStart(3, "0")}` : null,
          notes: type === "WASTAGE" ? "Expired / damaged" : null,
          userId: j % 2 === 0 ? owner.id : manager.id,
          createdAt: new Date(Date.now() - (j + 1) * 86400000 * (i + 1)),
        },
      });
    }
  }

  // Create a sample purchase order
  const items = await prisma.item.findMany({
    where: { organizationId: org.id },
    take: 5,
  });

  await prisma.purchaseOrder.create({
    data: {
      supplierId: supplier1.id,
      organizationId: org.id,
      status: "SENT",
      totalAmount: 2450.0,
      notes: "Monthly restocking order",
      orderDate: new Date(Date.now() - 3 * 86400000),
      expectedDate: new Date(Date.now() + 4 * 86400000),
      lines: {
        create: items.slice(0, 4).map((item, i) => ({
          itemId: item.id,
          quantity: (i + 1) * 10,
          unitCost: Math.round(Math.random() * 50 + 10) / 10,
          receivedQty: 0,
        })),
      },
    },
  });

  // Create some alerts for low stock items
  const lowStockRecords = await prisma.inventoryRecord.findMany({
    where: {
      item: { organizationId: org.id },
      quantity: { lte: 10 },
    },
    include: { item: true, location: true },
    take: 5,
  });

  for (const record of lowStockRecords) {
    await prisma.alert.create({
      data: {
        organizationId: org.id,
        itemId: record.itemId,
        locationId: record.locationId,
        type: record.quantity <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
        status: "OPEN",
        message: `${record.item.name} is running low at ${record.location.name}. Current quantity: ${record.quantity} ${record.item.unit}`,
      },
    });
  }

  console.log("Seed complete!");
  console.log(`\nDemo credentials:
  Owner:   owner@grandhotel.com / password123
  Manager: manager@grandhotel.com / password123
  Staff:   staff@grandhotel.com / password123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
