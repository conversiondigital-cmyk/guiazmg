-- Impulso (boost) que afecta el ranking + distintivo de negocio fundador.
-- Idempotente.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "isBoosted" boolean DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "boostedUntil" timestamp(3);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "isFounder" boolean DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS "isBoosted" boolean DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS "boostedUntil" timestamp(3);

-- Retro-llenado: si ya hay boosts vigentes en la tabla boosts, marca el perfil
-- o el producto correspondiente como impulsado (para no perder los activos).
UPDATE businesses b SET "isBoosted" = true, "boostedUntil" = sub.ends
FROM (
  SELECT "businessId" AS id, max("endsAt") AS ends FROM boosts
  WHERE status = 'ACTIVE' AND "endsAt" > now() AND "listingId" IS NULL
  GROUP BY "businessId"
) sub
WHERE b.id = sub.id;

UPDATE listings l SET "isBoosted" = true, "boostedUntil" = sub.ends
FROM (
  SELECT "listingId" AS id, max("endsAt") AS ends FROM boosts
  WHERE status = 'ACTIVE' AND "endsAt" > now() AND "listingId" IS NOT NULL
  GROUP BY "listingId"
) sub
WHERE l.id = sub.id;
