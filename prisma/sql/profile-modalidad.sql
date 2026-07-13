-- Fase 2: campos operativos del perfil (diferenciar Emprendedor vs Negocio).
-- Idempotente. hasPhysicalLocation: null=sin especificar; serviceModes: array de
-- códigos de modalidad; coverageArea: texto libre de zona de cobertura/entrega.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "hasPhysicalLocation" boolean;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "serviceModes" text[] DEFAULT '{}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "coverageArea" text;

-- A los perfiles NEGOCIO existentes se les marca hasPhysicalLocation=true si ya
-- tienen dirección; a los EMPRENDEDOR existentes, false. Solo donde está sin definir.
UPDATE businesses SET "hasPhysicalLocation" = true
  WHERE "hasPhysicalLocation" IS NULL AND "profileType" = 'NEGOCIO' AND "addressText" IS NOT NULL;
UPDATE businesses SET "hasPhysicalLocation" = false
  WHERE "hasPhysicalLocation" IS NULL AND "profileType" = 'EMPRENDEDOR';
