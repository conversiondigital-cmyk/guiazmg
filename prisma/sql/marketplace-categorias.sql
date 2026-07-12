-- Categorías de MARKETPLACE (marketplace_categories). Estaban vacías en prod
-- => el dropdown de categoría no funcionaba. Idempotente (ON CONFLICT slug).

-- Categorías top-level
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Electrónica', 'electronica', '📱', 0, true, now(), now())
ON CONFLICT (slug) DO NOTHING;
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Hogar y muebles', 'hogar-muebles', '🛋️', 1, true, now(), now())
ON CONFLICT (slug) DO NOTHING;
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Ropa y accesorios', 'ropa-accesorios', '👗', 2, true, now(), now())
ON CONFLICT (slug) DO NOTHING;
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Belleza y cuidado', 'belleza-cuidado', '💄', 3, true, now(), now())
ON CONFLICT (slug) DO NOTHING;
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Vehículos', 'vehiculos', '🚗', 4, true, now(), now())
ON CONFLICT (slug) DO NOTHING;
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Bebés y niños', 'bebes-ninos', '🧸', 5, true, now(), now())
ON CONFLICT (slug) DO NOTHING;
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Deportes y fitness', 'deportes', '⚽', 6, true, now(), now())
ON CONFLICT (slug) DO NOTHING;
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Mascotas', 'mascotas', '🐾', 7, true, now(), now())
ON CONFLICT (slug) DO NOTHING;
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Comida y despensa', 'comida-despensa', '🍰', 8, true, now(), now())
ON CONFLICT (slug) DO NOTHING;
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Servicios', 'servicios', '🔧', 9, true, now(), now())
ON CONFLICT (slug) DO NOTHING;
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Herramientas y construcción', 'herramientas', '🛠️', 10, true, now(), now())
ON CONFLICT (slug) DO NOTHING;
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Libros y entretenimiento', 'libros-entretenimiento', '📚', 11, true, now(), now())
ON CONFLICT (slug) DO NOTHING;
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Otros', 'otros', '📦', 12, true, now(), now())
ON CONFLICT (slug) DO NOTHING;

-- Subcategorías (parentId se resuelve por el slug del padre)
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "parentId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.name, v.slug, NULL, v.ord, true, p.id, now(), now()
FROM (VALUES
  ('electronica','Celulares','electronica-celulares',0),
  ('electronica','Computadoras','electronica-computadoras',1),
  ('electronica','Videojuegos','electronica-videojuegos',2),
  ('electronica','Audio y video','electronica-audio-y-video',3),
  ('electronica','Accesorios','electronica-accesorios',4),
  ('hogar-muebles','Muebles','hogar-muebles-muebles',0),
  ('hogar-muebles','Electrodomésticos','hogar-muebles-electrodomesticos',1),
  ('hogar-muebles','Decoración','hogar-muebles-decoracion',2),
  ('hogar-muebles','Cocina','hogar-muebles-cocina',3),
  ('ropa-accesorios','Ropa','ropa-accesorios-ropa',0),
  ('ropa-accesorios','Calzado','ropa-accesorios-calzado',1),
  ('ropa-accesorios','Bolsas y mochilas','ropa-accesorios-bolsas-y-mochilas',2),
  ('ropa-accesorios','Joyería y relojes','ropa-accesorios-joyeria-y-relojes',3),
  ('belleza-cuidado','Cosméticos','belleza-cuidado-cosmeticos',0),
  ('belleza-cuidado','Perfumes','belleza-cuidado-perfumes',1),
  ('belleza-cuidado','Cuidado personal','belleza-cuidado-cuidado-personal',2),
  ('vehiculos','Autos','vehiculos-autos',0),
  ('vehiculos','Motos','vehiculos-motos',1),
  ('vehiculos','Refacciones','vehiculos-refacciones',2),
  ('vehiculos','Bicicletas','vehiculos-bicicletas',3),
  ('bebes-ninos','Ropa de bebé','bebes-ninos-ropa-de-bebe',0),
  ('bebes-ninos','Juguetes','bebes-ninos-juguetes',1),
  ('bebes-ninos','Artículos para bebé','bebes-ninos-articulos-para-bebe',2),
  ('deportes','Equipo deportivo','deportes-equipo-deportivo',0),
  ('deportes','Gimnasio en casa','deportes-gimnasio-en-casa',1),
  ('deportes','Ciclismo','deportes-ciclismo',2),
  ('mascotas','Alimento','mascotas-alimento',0),
  ('mascotas','Accesorios para mascotas','mascotas-accesorios-para-mascotas',1),
  ('comida-despensa','Comida casera','comida-despensa-comida-casera',0),
  ('comida-despensa','Repostería','comida-despensa-reposteria',1),
  ('comida-despensa','Productos artesanales','comida-despensa-productos-artesanales',2),
  ('servicios','Clases y cursos','servicios-clases-y-cursos',0),
  ('servicios','Reparaciones','servicios-reparaciones',1),
  ('servicios','Eventos y fiestas','servicios-eventos-y-fiestas',2),
  ('servicios','Limpieza','servicios-limpieza',3),
  ('herramientas','Herramientas','herramientas-herramientas',0),
  ('herramientas','Materiales','herramientas-materiales',1),
  ('libros-entretenimiento','Libros','libros-entretenimiento-libros',0),
  ('libros-entretenimiento','Música','libros-entretenimiento-musica',1),
  ('libros-entretenimiento','Coleccionables','libros-entretenimiento-coleccionables',2)
) AS v(pslug, name, slug, ord)
JOIN marketplace_categories p ON p.slug = v.pslug
ON CONFLICT (slug) DO NOTHING;
