-- Add goLiveAt to Organization (safe if already exists)
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "goLiveAt" TIMESTAMP(3);

-- Create Comment table (safe if already exists)
CREATE TABLE IF NOT EXISTS "Comment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- Create index (safe if already exists)
CREATE INDEX IF NOT EXISTS "Comment_entityType_entityId_idx" ON "Comment"("entityType", "entityId");

-- Foreign key: Comment → Organization (safe if already exists)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Comment_organizationId_fkey'
    ) THEN
        ALTER TABLE "Comment" ADD CONSTRAINT "Comment_organizationId_fkey"
        FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Foreign key: Comment → User (safe if already exists)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Comment_userId_fkey'
    ) THEN
        ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Add trackingType to Item (safe if already exists)
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "trackingType" TEXT NOT NULL DEFAULT 'CONSUMABLE';

-- Add batch and lot tracking to StockMovement (safe if already exists)
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "batchNumber" TEXT;
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "lotNumber" TEXT;
