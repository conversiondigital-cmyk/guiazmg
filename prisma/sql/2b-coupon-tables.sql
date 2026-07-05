-- Tablas de cupones de prueba — ADITIVO e IDEMPOTENTE (no borra ni altera nada
-- existente). Correr en prod UNA vez con la DATABASE_URL de producción.
--   DATABASE_URL="<url-de-prod>" npx prisma db execute --file prisma/sql/2b-coupon-tables.sql --schema prisma/schema.prisma

CREATE TABLE IF NOT EXISTS "membership_coupons" (
  "id"              TEXT NOT NULL,
  "code"            TEXT NOT NULL,
  "planId"          TEXT NOT NULL,
  "days"            INTEGER NOT NULL,
  "maxRedemptions"  INTEGER,
  "redemptionCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt"       TIMESTAMP(3),
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "note"            TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "membership_coupons_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "membership_coupons_code_key" ON "membership_coupons" ("code");
CREATE INDEX IF NOT EXISTS "membership_coupons_code_idx" ON "membership_coupons" ("code");

CREATE TABLE IF NOT EXISTS "membership_coupon_redemptions" (
  "id"         TEXT NOT NULL,
  "couponId"   TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "days"       INTEGER NOT NULL,
  "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "membership_coupon_redemptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "membership_coupon_redemptions_couponId_businessId_key"
  ON "membership_coupon_redemptions" ("couponId", "businessId");
CREATE INDEX IF NOT EXISTS "membership_coupon_redemptions_businessId_idx"
  ON "membership_coupon_redemptions" ("businessId");
CREATE INDEX IF NOT EXISTS "membership_coupon_redemptions_userId_idx"
  ON "membership_coupon_redemptions" ("userId");

-- Llaves foráneas (idempotentes)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'membership_coupons_planId_fkey') THEN
    ALTER TABLE "membership_coupons"
      ADD CONSTRAINT "membership_coupons_planId_fkey"
      FOREIGN KEY ("planId") REFERENCES "membership_plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'membership_coupon_redemptions_couponId_fkey') THEN
    ALTER TABLE "membership_coupon_redemptions"
      ADD CONSTRAINT "membership_coupon_redemptions_couponId_fkey"
      FOREIGN KEY ("couponId") REFERENCES "membership_coupons" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
