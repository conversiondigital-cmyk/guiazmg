-- Mejora del buscador (Fase 1 + 2). ADITIVO e IDEMPOTENTE (no borra datos).
-- Habilita unaccent, agrega keywords/sinónimos por categoría, y reconstruye el
-- search_vector con acentos normalizados + pesos + keywords de la categoría.
-- Correr UNA vez (en prod con la DATABASE_URL de Neon):
--   DATABASE_URL="<url>" npx tsx prisma/apply-sql.ts prisma/sql/search-upgrade.sql

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Fase 2: sinónimos/keywords por categoría (texto libre separado por espacios/comas).
ALTER TABLE categories ADD COLUMN IF NOT EXISTS keywords text;

-- Set inicial de keywords para categorías comunes (best-effort por nombre; solo
-- rellena las vacías → seguro re-correr y no pisa lo que edites en el admin).
UPDATE categories SET keywords = 'taco tacos taqueria pastor asada suadero birria quesadilla antojitos comida mexicana fonda cocina mariscos'
  WHERE keywords IS NULL AND unaccent(lower(name)) ~ '(restaurant|taqueri|comida|antojito|fonda|cocina|marisc)';
UPDATE categories SET keywords = 'cafe cafeteria capuchino latte espresso pan panaderia pasteleria postre reposteria'
  WHERE keywords IS NULL AND unaccent(lower(name)) ~ '(cafe|caf |panaderi|pasteleri|reposteri)';
UPDATE categories SET keywords = 'doctor medico clinica consultorio salud hospital farmacia dentista'
  WHERE keywords IS NULL AND unaccent(lower(name)) ~ '(salud|medic|clinic|hospital|dental|dentista|farmac)';
UPDATE categories SET keywords = 'taller mecanico automotriz auto carro coche refaccion llantas hojalateria'
  WHERE keywords IS NULL AND unaccent(lower(name)) ~ '(automotriz|taller|mecanic|refaccion|llant)';

-- Reconstruye el search_vector: unaccent (acentos) + pesos
-- (nombre = A, categoría+keywords = B, descripción = C, subcategoría = C).
CREATE OR REPLACE FUNCTION businesses_search_vector_update() RETURNS trigger AS $$
DECLARE
  cat_text text := '';
  subcat_text text := '';
BEGIN
  SELECT COALESCE(name, '') || ' ' || COALESCE(keywords, '') INTO cat_text
    FROM categories WHERE id = NEW."categoryId";
  SELECT COALESCE(name, '') INTO subcat_text
    FROM subcategories WHERE id = NEW."subcategoryId";
  NEW.search_vector :=
    setweight(to_tsvector('spanish', unaccent(COALESCE(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('spanish', unaccent(COALESCE(cat_text, ''))), 'B') ||
    setweight(to_tsvector('spanish', unaccent(COALESCE(NEW."shortDescription", '') || ' ' || COALESCE(NEW.description, ''))), 'C') ||
    setweight(to_tsvector('spanish', unaccent(COALESCE(subcat_text, ''))), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- El trigger ahora también se dispara si cambia la categoría/subcategoría.
DROP TRIGGER IF EXISTS trg_businesses_search_vector ON businesses;
CREATE TRIGGER trg_businesses_search_vector
  BEFORE INSERT OR UPDATE OF name, "shortDescription", description, "categoryId", "subcategoryId"
  ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION businesses_search_vector_update();

-- Backfill de todas las filas existentes con el nuevo vector.
UPDATE businesses b SET search_vector =
  setweight(to_tsvector('spanish', unaccent(COALESCE(b.name, ''))), 'A') ||
  setweight(to_tsvector('spanish', unaccent(
    COALESCE((SELECT name FROM categories WHERE id = b."categoryId"), '') || ' ' ||
    COALESCE((SELECT keywords FROM categories WHERE id = b."categoryId"), '')
  )), 'B') ||
  setweight(to_tsvector('spanish', unaccent(COALESCE(b."shortDescription", '') || ' ' || COALESCE(b.description, ''))), 'C') ||
  setweight(to_tsvector('spanish', unaccent(COALESCE((SELECT name FROM subcategories WHERE id = b."subcategoryId"), ''))), 'C');
