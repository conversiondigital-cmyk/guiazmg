-- Tabla de tokens de refresco de la app móvil (fase B1).
--
-- SEGURIDAD DE ESTE SCRIPT — léelo antes de correrlo:
--   · Es IDEMPOTENTE: se puede ejecutar varias veces sin efecto adicional.
--   · Es ADITIVO: crea una tabla NUEVA. No hay ningún ALTER, ningún DROP y
--     ninguna escritura sobre datos existentes.
--   · La única relación es SALIENTE (mobile_refresh_tokens -> users). La tabla
--     `users` NO se modifica: la relación inversa que declara Prisma vive solo
--     en el cliente y no genera SQL.
--   · Riesgo de pérdida de datos: NINGUNO.
--
-- CÓMO APLICARLO a la base de producción (Neon):
--   psql "$DATABASE_URL_DE_PRODUCCION" -f prisma/sql/2026-08-21-mobile-refresh-tokens.sql
--
-- Antes conviene un respaldo (`npm run backup:daily`), no porque este script
-- lo necesite, sino porque es la disciplina para cualquier cambio de esquema
-- en una base viva.
--
-- QUÉ PASA SI NO SE APLICA: el login de la app falla con un error de base de
-- datos. Los endpoints públicos (buscar, ver negocio, mapa, marketplace)
-- siguen funcionando, porque no tocan esta tabla.

BEGIN;

CREATE TABLE IF NOT EXISTS public.mobile_refresh_tokens (
    id             text NOT NULL,
    "userId"       text NOT NULL,
    "tokenHash"    text NOT NULL,
    "familyId"     text NOT NULL,
    "deviceId"     text,
    platform       text,
    "appVersion"   text,
    "userAgent"    text,
    ip             text,
    "expiresAt"    timestamp(3) without time zone NOT NULL,
    "revokedAt"    timestamp(3) without time zone,
    "replacedById" text,
    "lastUsedAt"   timestamp(3) without time zone,
    "createdAt"    timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT mobile_refresh_tokens_pkey PRIMARY KEY (id)
);

-- El token nunca se guarda en claro: esta columna lleva su SHA-256, y el
-- índice único es lo que permite buscarlo sin recorrer la tabla.
CREATE UNIQUE INDEX IF NOT EXISTS "mobile_refresh_tokens_tokenHash_key"
    ON public.mobile_refresh_tokens USING btree ("tokenHash");

CREATE INDEX IF NOT EXISTS "mobile_refresh_tokens_userId_idx"
    ON public.mobile_refresh_tokens USING btree ("userId");

-- familyId agrupa todos los tokens rotados de un mismo dispositivo. Al
-- detectar el reuso de uno viejo (señal de robo) se revoca la familia entera,
-- y esa operación busca por este índice.
CREATE INDEX IF NOT EXISTS "mobile_refresh_tokens_familyId_idx"
    ON public.mobile_refresh_tokens USING btree ("familyId");

-- Para poder limpiar periódicamente los vencidos sin recorrer toda la tabla.
CREATE INDEX IF NOT EXISTS "mobile_refresh_tokens_expiresAt_idx"
    ON public.mobile_refresh_tokens USING btree ("expiresAt");

-- ON DELETE CASCADE: si se borra una cuenta, sus tokens se van con ella.
-- Es requisito de la petición de borrado de datos (y de Google Play).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'mobile_refresh_tokens_userId_fkey'
    ) THEN
        ALTER TABLE ONLY public.mobile_refresh_tokens
            ADD CONSTRAINT "mobile_refresh_tokens_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES public.users(id)
            ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
END $$;

COMMIT;

-- Comprobación posterior (debe devolver 1):
--   SELECT count(*) FROM information_schema.tables
--   WHERE table_schema='public' AND table_name='mobile_refresh_tokens';
