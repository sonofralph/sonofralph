-- Add goLiveAt to Organization
ALTER TABLE "Organization" ADD COLUMN "goLiveAt" TIMESTAMP(3);

-- Create Comment table
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- Create index for Comment lookups by entity
CREATE INDEX "Comment_entityType_entityId_idx" ON "Comment"("entityType", "entityId");

-- Add foreign keys for Comment
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add trackingType to Item (CONSUMABLE | REUSABLE | ASSET)
ALTER TABLE "Item" ADD COLUMN "trackingType" TEXT NOT NULL DEFAULT 'CONSUMABLE';

-- Add batch and lot tracking to StockMovement
ALTER TABLE "StockMovement" ADD COLUMN "batchNumber" TEXT;
ALTER TABLE "StockMovement" ADD COLUMN "lotNumber" TEXT;
