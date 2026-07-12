-- Categorias y subcategorias nuevas (basadas en el analisis de los chats de ZMG).
-- Idempotente: ON CONFLICT sobre slug (categorias) y (categoryId, slug) (subcategorias).

-- Nuevas categorias top-level
INSERT INTO categories (id, name, slug, icon, keywords, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Bienes raíces', 'bienes-raices', '🏘️', 'renta casa departamento venta propiedad terreno inmobiliaria bienes raices local bodega renta cuarto', true, 100, now(), now())
ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (id, name, slug, icon, keywords, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Jardín y plantas', 'jardin-y-plantas', '🌿', 'vivero viveros planta plantas flor flores floreria maceta jardin suculenta arbol arreglo floral', true, 101, now(), now())
ON CONFLICT (slug) DO NOTHING;

-- Subcategorias (el id de la categoria se resuelve por NOMBRE)
INSERT INTO subcategories (id, "categoryId", name, slug, "isActive", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c.id, v.name, v.slug, true, v.ord, now(), now()
FROM (VALUES
  ('Alimentación','Comida casera','comida-casera',200),
  ('Alimentación','Repostería y pasteles','reposteria-y-pasteles',201),
  ('Alimentación','Tamales y antojitos','tamales-y-antojitos',202),
  ('Alimentación','Panadería','panaderia',203),
  ('Alimentación','Comida saludable','comida-saludable',204),
  ('Alimentación','Mariscos','mariscos',205),
  ('Servicios','Renta para eventos','renta-para-eventos',200),
  ('Servicios','Banquetes y taquizas','banquetes-y-taquizas',201),
  ('Servicios','Cómputo y celulares','computo-y-celulares',202),
  ('Servicios','Seguridad y CCTV','seguridad-y-cctv',203),
  ('Servicios','Energía solar','energia-solar',204),
  ('Servicios','Aire y refrigeración','aire-y-refrigeracion',205),
  ('Servicios','Reparación de electrodomésticos','reparacion-de-electrodomesticos',206),
  ('Servicios','Costura y sastrería','costura-y-sastreria',207),
  ('Servicios','Fumigación','fumigacion',208),
  ('Servicios','Fletes y mudanzas','fletes-y-mudanzas',209),
  ('Compras','Venta por catálogo','venta-por-catalogo',200),
  ('Compras','Cosméticos y perfumería','cosmeticos-y-perfumeria',201),
  ('Compras','Joyería y accesorios','joyeria-y-accesorios',202),
  ('Compras','Calzado','calzado',203),
  ('Compras','Productos naturistas','productos-naturistas',204),
  ('Compras','Papelería','papeleria',205),
  ('Profesionales','Fotografía y video','fotografia-y-video',200),
  ('Profesionales','Marketing y diseño','marketing-y-diseno',201),
  ('Entretenimiento','DJ y sonido','dj-y-sonido',200),
  ('Entretenimiento','Mariachi y música','mariachi-y-musica',201),
  ('Entretenimiento','Fotografía de eventos','fotografia-de-eventos',202),
  ('Entretenimiento','Renta de mobiliario','renta-de-mobiliario',203),
  ('Educación','Clases en línea','clases-en-linea',200),
  ('Educación','Música e instrumentos','musica-e-instrumentos',201),
  ('Educación','Regularización escolar','regularizacion-escolar',202),
  ('Educación','Manualidades y talleres','manualidades-y-talleres',203),
  ('Hogar','Cámaras y seguridad','camaras-y-seguridad',200),
  ('Hogar','Herrería y aluminio','herreria-y-aluminio',201),
  ('Hogar','Aire acondicionado','aire-acondicionado',202),
  ('Hogar','Impermeabilización','impermeabilizacion',203),
  ('Belleza','Uñas','unas',200),
  ('Belleza','Cejas y pestañas','cejas-y-pestanas',201),
  ('Belleza','Masajes y spa','masajes-y-spa',202),
  ('Belleza','Depilación','depilacion',203),
  ('Mascotas','Estética canina','estetica-canina',200),
  ('Mascotas','Alimento y accesorios','alimento-y-accesorios',201),
  ('Salud','Nutrición','nutricion',200),
  ('Salud','Laboratorios','laboratorios',201),
  ('Salud','Cuidado y enfermería','cuidado-y-enfermeria',202),
  ('Salud','Psicología','psicologia',203),
  ('Automotriz','Autolavado','autolavado',200),
  ('Automotriz','Polarizado y vidrios','polarizado-y-vidrios',201),
  ('Automotriz','Hojalatería y pintura','hojalateria-y-pintura',202),
  ('Bienes raíces','Renta de casa o depto','renta-de-casa-o-depto',200),
  ('Bienes raíces','Venta de propiedades','venta-de-propiedades',201),
  ('Bienes raíces','Terrenos','terrenos',202),
  ('Bienes raíces','Locales y bodegas','locales-y-bodegas',203),
  ('Jardín y plantas','Viveros','viveros',200),
  ('Jardín y plantas','Florerías','florerias',201),
  ('Jardín y plantas','Diseño de jardines','diseno-de-jardines',202),
  ('Jardín y plantas','Macetas y decoración','macetas-y-decoracion',203)
) AS v(cat, name, slug, ord)
JOIN categories c ON c.name = v.cat
ON CONFLICT ("categoryId", slug) DO NOTHING;
