-- Marketplace temporal: columna de expiración de la publicación. Idempotente.
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS "expiresAt" timestamp(3);

-- Backfill seguro: a las publicaciones ACTIVE sin fecha se les da una ventana
-- fresca de 30 días desde ahora (no se expira nada de golpe). Las demás quedan NULL.
UPDATE marketplace_listings
SET "expiresAt" = now() + interval '30 days'
WHERE status = 'ACTIVE' AND "expiresAt" IS NULL;
