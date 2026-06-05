-- Enable pg_trgm extension for approximate/fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add tsvector column for full-text search on businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for fast full-text search queries
CREATE INDEX IF NOT EXISTS idx_businesses_search_vector ON businesses USING GIN (search_vector);

-- Create trigram indexes for LIKE/ILIKE queries (autocomplete suggestions)
CREATE INDEX IF NOT EXISTS idx_businesses_name_trgm ON businesses USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_businesses_description_trgm ON businesses USING GIN (COALESCE(description, '') gin_trgm_ops);

-- Create combined index for geo-filtered searches (category + municipio + status)
CREATE INDEX IF NOT EXISTS idx_businesses_listing ON businesses (status, "categoryId", "municipalityId");

-- Create index for distance-based sorting on coordinates
CREATE INDEX IF NOT EXISTS idx_businesses_coords ON businesses (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Function to update search_vector on businesses
CREATE OR REPLACE FUNCTION businesses_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('spanish',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW."shortDescription", '') || ' ' ||
    COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search_vector on INSERT or UPDATE
DROP TRIGGER IF EXISTS trg_businesses_search_vector ON businesses;
CREATE TRIGGER trg_businesses_search_vector
  BEFORE INSERT OR UPDATE OF name, "shortDescription", description
  ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION businesses_search_vector_update();

-- Update existing rows
UPDATE businesses SET search_vector = to_tsvector('spanish',
  COALESCE(name, '') || ' ' ||
  COALESCE("shortDescription", '') || ' ' ||
  COALESCE(description, '')
);
