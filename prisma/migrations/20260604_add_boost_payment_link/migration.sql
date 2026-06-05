-- Add payment linkage to boosts for payment reconciliation
ALTER TABLE "boosts"
ADD COLUMN "paymentId" TEXT;

CREATE UNIQUE INDEX "boosts_paymentId_key"
ON "boosts"("paymentId");

ALTER TABLE "boosts"
ADD CONSTRAINT "boosts_paymentId_fkey"
FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
