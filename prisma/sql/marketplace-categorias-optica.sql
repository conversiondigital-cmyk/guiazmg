-- Amplía categorías de marketplace para óptica/aire libre (binoculares, cámaras,
-- drones, telescopios, camping…). Idempotente (ON CONFLICT slug). parentId por slug.
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "parentId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.name, v.slug, NULL, v.ord, true, p.id, now(), now()
FROM (VALUES
  ('electronica','Cámaras, drones y óptica','electronica-camaras-drones-optica',5),
  ('deportes','Aire libre y camping','deportes-aire-libre-y-camping',3)
) AS v(pslug, name, slug, ord)
JOIN marketplace_categories p ON p.slug = v.pslug
ON CONFLICT (slug) DO NOTHING;
