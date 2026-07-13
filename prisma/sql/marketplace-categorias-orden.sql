-- Reordena las categorías de marketplace de forma PREDECIBLE (alfabética), en vez
-- del orden de inserción arbitrario que tenían. Los "cajón de sastre" (Otros,
-- Accesorios, Otras) quedan al final. Determinista e idempotente: re-correrlo da
-- el mismo resultado. Usa sortOrder, que es el campo previsto para el orden de
-- despliegue (el código ya ordena por sortOrder).

-- Top-level: alfabético, 'Otros' al final.
WITH ordered AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY (slug = 'otros'), name) - 1 AS rn
  FROM marketplace_categories
  WHERE "parentId" IS NULL
)
UPDATE marketplace_categories m
SET "sortOrder" = o.rn, "updatedAt" = now()
FROM ordered o
WHERE m.id = o.id;

-- Subcategorías: alfabético dentro de cada padre; genéricas ('Accesorios',
-- 'Otros', 'Otras') al final de su grupo.
WITH ordered AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY "parentId"
           ORDER BY (name IN ('Accesorios', 'Otros', 'Otras')), name
         ) - 1 AS rn
  FROM marketplace_categories
  WHERE "parentId" IS NOT NULL
)
UPDATE marketplace_categories m
SET "sortOrder" = o.rn, "updatedAt" = now()
FROM ordered o
WHERE m.id = o.id;
