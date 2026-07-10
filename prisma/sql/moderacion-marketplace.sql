-- Fase B — Moderación del marketplace. ADITIVO e IDEMPOTENTE (no borra ni altera datos).
-- Agrega el estado PENDING al enum para que los anuncios NUEVOS entren a la cola de
-- revisión. La app ya los crea con status='PENDING' explícito, así que esta línea
-- (habilitar el valor en el enum) es lo único imprescindible en prod.
--
-- Los anuncios ACTIVOS existentes NO se tocan (siguen públicos). Correr UNA vez:
--   DATABASE_URL="<url-de-prod-Neon>" npx tsx prisma/apply-sql.ts prisma/sql/moderacion-marketplace.sql

ALTER TYPE "MarketplaceListingStatus" ADD VALUE IF NOT EXISTS 'PENDING';

-- Opcional (defensa en profundidad; la app ya setea el status explícito, no hace
-- falta). Si lo corres, debe ir en una transacción SEPARADA del ADD VALUE de arriba:
--   ALTER TABLE "marketplace_listings" ALTER COLUMN "status" SET DEFAULT 'PENDING';
