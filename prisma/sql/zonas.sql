-- Zonas hiperlocales (SEO). Agrupan colonias cercanas dentro de un municipio.
-- Idempotente: CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS.
-- Aditivo puro: no toca datos existentes.

CREATE TABLE IF NOT EXISTS zones (
  id                text PRIMARY KEY,
  "municipalityId"  text NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  name              text NOT NULL,
  slug              text NOT NULL,
  description       text,
  "heroImageUrl"    text,
  priority          integer NOT NULL DEFAULT 0,
  "isActive"        boolean NOT NULL DEFAULT true,
  "isSeoIndexable"  boolean NOT NULL DEFAULT true,
  "nearbyZoneSlugs" text[]  NOT NULL DEFAULT '{}',
  "seoTitle"        text,
  "seoDescription"  text,
  "createdAt"       timestamp(3) NOT NULL DEFAULT now(),
  "updatedAt"       timestamp(3) NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS zones_municipality_slug_key ON zones("municipalityId", slug);
CREATE INDEX IF NOT EXISTS zones_municipality_idx ON zones("municipalityId");

-- Colonias: enlace opcional a su zona + campos SEO por colonia.
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS "zoneId"         text REFERENCES zones(id) ON DELETE SET NULL;
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS "heroImageUrl"   text;
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS "isSeoIndexable" boolean NOT NULL DEFAULT true;
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS "seoTitle"       text;
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS "seoDescription" text;

CREATE INDEX IF NOT EXISTS neighborhoods_zone_idx ON neighborhoods("zoneId");
