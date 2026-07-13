-- Ampliación de categorías/subcategorías de marketplace. Idempotente (ON CONFLICT
-- slug DO NOTHING). El sortOrder se corrige después con el reorden alfabético.

-- 1) Categorías top-level NUEVAS
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.name, v.slug, v.icon, 50, true, now(), now()
FROM (VALUES
  ('Inmuebles', 'inmuebles', '🏠'),
  ('Instrumentos musicales', 'instrumentos', '🎸'),
  ('Arte y manualidades', 'arte-manualidades', '🎨'),
  ('Agro y jardín', 'agro-jardin', '🌱'),
  ('Salud y bienestar', 'salud-bienestar', '🩺'),
  ('Oficina y papelería', 'oficina-papeleria', '🖊️')
) AS v(name, slug, icon)
ON CONFLICT (slug) DO NOTHING;

-- 2) Subcategorías NUEVAS (para categorías existentes y nuevas). parentId por slug.
INSERT INTO marketplace_categories (id, name, slug, icon, "sortOrder", "isActive", "parentId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.name, v.slug, NULL, 50, true, p.id, now(), now()
FROM (VALUES
  -- Electrónica
  ('electronica','Tablets','electronica-tablets'),
  ('electronica','Laptops','electronica-laptops'),
  ('electronica','Smartwatches','electronica-smartwatches'),
  ('electronica','Impresoras y tinta','electronica-impresoras-y-tinta'),
  ('electronica','Componentes de PC','electronica-componentes-de-pc'),
  ('electronica','Redes y routers','electronica-redes-y-routers'),
  -- Hogar y muebles
  ('hogar-muebles','Jardín y exterior','hogar-muebles-jardin-y-exterior'),
  ('hogar-muebles','Iluminación','hogar-muebles-iluminacion'),
  ('hogar-muebles','Colchones','hogar-muebles-colchones'),
  ('hogar-muebles','Baño','hogar-muebles-bano'),
  ('hogar-muebles','Organización','hogar-muebles-organizacion'),
  -- Ropa y accesorios
  ('ropa-accesorios','Ropa de hombre','ropa-accesorios-ropa-de-hombre'),
  ('ropa-accesorios','Ropa de mujer','ropa-accesorios-ropa-de-mujer'),
  ('ropa-accesorios','Ropa deportiva','ropa-accesorios-ropa-deportiva'),
  ('ropa-accesorios','Lentes y gafas','ropa-accesorios-lentes-y-gafas'),
  ('ropa-accesorios','Sombreros y gorras','ropa-accesorios-sombreros-y-gorras'),
  -- Belleza y cuidado
  ('belleza-cuidado','Cabello','belleza-cuidado-cabello'),
  ('belleza-cuidado','Uñas','belleza-cuidado-unas'),
  ('belleza-cuidado','Maquillaje','belleza-cuidado-maquillaje'),
  ('belleza-cuidado','Cuidado de la piel','belleza-cuidado-cuidado-de-la-piel'),
  -- Vehículos
  ('vehiculos','Camionetas','vehiculos-camionetas'),
  ('vehiculos','Llantas y rines','vehiculos-llantas-y-rines'),
  ('vehiculos','Audio para auto','vehiculos-audio-para-auto'),
  ('vehiculos','Cascos y accesorios','vehiculos-cascos-y-accesorios'),
  -- Bebés y niños
  ('bebes-ninos','Carriolas','bebes-ninos-carriolas'),
  ('bebes-ninos','Sillas de auto','bebes-ninos-sillas-de-auto'),
  ('bebes-ninos','Pañales y alimentación','bebes-ninos-panales-y-alimentacion'),
  -- Deportes y fitness
  ('deportes','Fútbol','deportes-futbol'),
  ('deportes','Pesca','deportes-pesca'),
  ('deportes','Patines y scooters','deportes-patines-y-scooters'),
  ('deportes','Suplementos','deportes-suplementos'),
  -- Mascotas
  ('mascotas','Perros','mascotas-perros'),
  ('mascotas','Gatos','mascotas-gatos'),
  ('mascotas','Aves','mascotas-aves'),
  ('mascotas','Peces y acuarios','mascotas-peces-y-acuarios'),
  ('mascotas','Jaulas y camas','mascotas-jaulas-y-camas'),
  -- Comida y despensa
  ('comida-despensa','Bebidas','comida-despensa-bebidas'),
  ('comida-despensa','Dulces y botanas','comida-despensa-dulces-y-botanas'),
  ('comida-despensa','Orgánicos','comida-despensa-organicos'),
  -- Servicios
  ('servicios','Belleza y estética','servicios-belleza-y-estetica'),
  ('servicios','Fletes y mudanzas','servicios-fletes-y-mudanzas'),
  ('servicios','Fotografía y video','servicios-fotografia-y-video'),
  ('servicios','Diseño y web','servicios-diseno-y-web'),
  ('servicios','Cuidado (niños/adultos)','servicios-cuidado-ninos-adultos'),
  ('servicios','Mecánica','servicios-mecanica'),
  ('servicios','Jardinería','servicios-jardineria'),
  -- Herramientas y construcción
  ('herramientas','Eléctricas','herramientas-electricas'),
  ('herramientas','Manuales','herramientas-manuales'),
  ('herramientas','Plomería','herramientas-plomeria'),
  ('herramientas','Pintura','herramientas-pintura'),
  ('herramientas','Seguridad','herramientas-seguridad'),
  -- Libros y entretenimiento
  ('libros-entretenimiento','Películas y series','libros-entretenimiento-peliculas-y-series'),
  ('libros-entretenimiento','Juegos de mesa','libros-entretenimiento-juegos-de-mesa'),
  ('libros-entretenimiento','Cómics y manga','libros-entretenimiento-comics-y-manga'),
  -- Inmuebles (nueva)
  ('inmuebles','Renta de casas/deptos','inmuebles-renta-casas-deptos'),
  ('inmuebles','Venta de casas/deptos','inmuebles-venta-casas-deptos'),
  ('inmuebles','Cuartos y roomies','inmuebles-cuartos-y-roomies'),
  ('inmuebles','Locales y oficinas','inmuebles-locales-y-oficinas'),
  ('inmuebles','Terrenos','inmuebles-terrenos'),
  ('inmuebles','Bodegas','inmuebles-bodegas'),
  -- Instrumentos (nueva)
  ('instrumentos','Guitarras','instrumentos-guitarras'),
  ('instrumentos','Teclados y pianos','instrumentos-teclados-y-pianos'),
  ('instrumentos','Percusión','instrumentos-percusion'),
  ('instrumentos','Viento','instrumentos-viento'),
  ('instrumentos','Audio y DJ','instrumentos-audio-y-dj'),
  ('instrumentos','Accesorios','instrumentos-accesorios'),
  -- Arte y manualidades (nueva)
  ('arte-manualidades','Pintura y dibujo','arte-manualidades-pintura-y-dibujo'),
  ('arte-manualidades','Manualidades','arte-manualidades-manualidades'),
  ('arte-manualidades','Costura y tejido','arte-manualidades-costura-y-tejido'),
  ('arte-manualidades','Cerámica','arte-manualidades-ceramica'),
  ('arte-manualidades','Materiales','arte-manualidades-materiales'),
  -- Agro y jardín (nueva)
  ('agro-jardin','Plantas','agro-jardin-plantas'),
  ('agro-jardin','Herramienta de jardín','agro-jardin-herramienta-de-jardin'),
  ('agro-jardin','Semillas','agro-jardin-semillas'),
  ('agro-jardin','Macetas','agro-jardin-macetas'),
  ('agro-jardin','Animales de granja','agro-jardin-animales-de-granja'),
  ('agro-jardin','Riego','agro-jardin-riego'),
  -- Salud y bienestar (nueva)
  ('salud-bienestar','Suplementos','salud-bienestar-suplementos'),
  ('salud-bienestar','Equipo médico','salud-bienestar-equipo-medico'),
  ('salud-bienestar','Ortopedia','salud-bienestar-ortopedia'),
  ('salud-bienestar','Fitness','salud-bienestar-fitness'),
  -- Oficina y papelería (nueva)
  ('oficina-papeleria','Papelería','oficina-papeleria-papeleria'),
  ('oficina-papeleria','Muebles de oficina','oficina-papeleria-muebles-de-oficina'),
  ('oficina-papeleria','Impresión','oficina-papeleria-impresion'),
  ('oficina-papeleria','Escolar','oficina-papeleria-escolar')
) AS v(pslug, name, slug)
JOIN marketplace_categories p ON p.slug = v.pslug
ON CONFLICT (slug) DO NOTHING;
