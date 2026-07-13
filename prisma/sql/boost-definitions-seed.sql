-- Planes de boost (7/15/30/90 días). Se insertan SOLO si la tabla está vacía,
-- así es idempotente y no crea duplicados (boost_definitions no tiene unique).
INSERT INTO boost_definitions (id, name, "durationDays", price, "priorityBonus", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.name, v.days, v.price, v.bonus, true, now(), now()
FROM (VALUES
  ('7 Días', 7, 49, 2),
  ('15 Días', 15, 99, 3),
  ('30 Días', 30, 149, 5),
  ('90 Días', 90, 399, 8)
) AS v(name, days, price, bonus)
WHERE NOT EXISTS (SELECT 1 FROM boost_definitions);
