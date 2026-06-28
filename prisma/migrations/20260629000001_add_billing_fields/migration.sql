ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "planStatus"           TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "orgSize"              TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "stripeCustomerId"     TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "trialEndsAt"          TIMESTAMP(3);
