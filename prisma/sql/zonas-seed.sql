-- Semilla de zonas hiperlocales + enlace de colonias a su zona.
-- Idempotente y transaccional. El municipio se resuelve por SLUG; si un municipio
-- no existe con ese slug, su zona simplemente no se crea (sin error).
-- Prioridad: Zapopan (en especial Zona Real).

BEGIN;

-- 1) Zonas ---------------------------------------------------------------------
INSERT INTO zones (id, "municipalityId", name, slug, description, priority, "nearbyZoneSlugs", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, m.id, v.name, v.slug, v.description, v.priority, v.nearby, now(), now()
FROM (VALUES
  -- Zapopan
  ('zapopan','zona-real','Zona Real','Zona Real y sus fraccionamientos residenciales al norte de Zapopan: Valle Real, Solares, Santa Margarita y colonias cercanas.',100,ARRAY['andares-puerta-de-hierro','centro-zapopan']::text[]),
  ('zapopan','andares-puerta-de-hierro','Andares / Puerta de Hierro','La zona premium de Zapopan alrededor de Andares y Puerta de Hierro: comercio, restaurantes y servicios de alto nivel.',90,ARRAY['zona-real','centro-zapopan']::text[]),
  ('zapopan','chapalita-ciudad-granja','Chapalita / Ciudad Granja','Chapalita, Ciudad Granja y colonias cercanas: una de las zonas mas tradicionales y transitadas del poniente.',80,ARRAY['centro-zapopan','sur-zapopan']::text[]),
  ('zapopan','centro-zapopan','Centro de Zapopan','El corazon de Zapopan, alrededor de la Basilica: negocios historicos, comercio y servicios de todos los dias.',70,ARRAY['zona-real','chapalita-ciudad-granja']::text[]),
  ('zapopan','sur-zapopan','Sur de Zapopan','El sur de Zapopan: El Colli, Las Aguilas, Mariano Otero y colonias cercanas con fuerte actividad comercial y de servicios.',60,ARRAY['chapalita-ciudad-granja']::text[]),
  -- Guadalajara
  ('guadalajara','centro-guadalajara','Centro de Guadalajara','El Centro Historico de Guadalajara y sus barrios: comercio, cultura y servicios en el corazon de la ciudad.',85,ARRAY['americana-chapultepec']::text[]),
  ('guadalajara','americana-chapultepec','Americana / Chapultepec','La zona mas vibrante de Guadalajara: Colonia Americana, Chapultepec y Lafayette, con restaurantes, cafes y vida nocturna.',85,ARRAY['centro-guadalajara']::text[]),
  ('guadalajara','oblatos-tetlan','Oblatos / Tetlan','Oblatos, Tetlan y colonias del oriente de Guadalajara: comercio de barrio y servicios cercanos.',55,ARRAY['huentitan']::text[]),
  ('guadalajara','huentitan','Huentitan','Huentitan y el norte de Guadalajara, junto a la Barranca: negocios locales y servicios de la zona.',55,ARRAY['oblatos-tetlan']::text[]),
  -- Tlaquepaque
  ('tlaquepaque','centro-tlaquepaque','Centro de Tlaquepaque','El Centro de San Pedro Tlaquepaque: artesania, restaurantes y el famoso Parian.',70,ARRAY['revolucion-forum']::text[]),
  ('tlaquepaque','revolucion-forum','Revolucion / Forum','La zona de Avenida Revolucion y Forum Tlaquepaque: comercio y servicios de alto flujo.',50,ARRAY['centro-tlaquepaque']::text[]),
  -- Tonala
  ('tonala','centro-tonala','Centro de Tonala','El Centro de Tonala: cuna de la artesania y el tianguis mas grande de la ZMG.',65,ARRAY['zona-artesanal-tonala']::text[]),
  ('tonala','zona-artesanal-tonala','Zona Artesanal de Tonala','El corazon artesanal de Tonala: talleres, ceramica y el tianguis artesanal.',60,ARRAY['centro-tonala']::text[]),
  -- Tlajomulco
  ('tlajomulco','lopez-mateos-sur','Lopez Mateos Sur','El corredor de Lopez Mateos Sur y Punto Sur: fraccionamientos, plazas y servicios en crecimiento.',65,ARRAY['tlajomulco-centro']::text[]),
  ('tlajomulco','tlajomulco-centro','Tlajomulco Centro','El Centro de Tlajomulco de Zuniga y sus delegaciones: negocios locales y servicios de la zona.',45,ARRAY['lopez-mateos-sur']::text[])
) v(mun, slug, name, description, priority, nearby)
JOIN municipalities m ON m.slug = v.mun
WHERE NOT EXISTS (SELECT 1 FROM zones z WHERE z."municipalityId" = m.id AND z.slug = v.slug);

-- 2) Mapa colonia -> zona (temp) ----------------------------------------------
CREATE TEMP TABLE _zmap (mun text, zone text, name text, slug text);
INSERT INTO _zmap (mun, zone, name, slug) VALUES
  -- Zona Real (Zapopan)
  ('zapopan','zona-real','Valle Real','valle-real'),
  ('zapopan','zona-real','Solares','solares'),
  ('zapopan','zona-real','Porta Real','porta-real'),
  ('zapopan','zona-real','Esencia Residencial','esencia-residencial'),
  ('zapopan','zona-real','Santa Margarita','santa-margarita'),
  ('zapopan','zona-real','Parque Real','parque-real'),
  ('zapopan','zona-real','Jardin Real','jardin-real'),
  ('zapopan','zona-real','Puerta Real','puerta-real'),
  ('zapopan','zona-real','La Toscana','la-toscana'),
  ('zapopan','zona-real','Viveros del Valle','viveros-del-valle'),
  ('zapopan','zona-real','Rinconada de los Fresnos','rinconada-de-los-fresnos'),
  ('zapopan','zona-real','Parques de Zapopan','parques-de-zapopan'),
  ('zapopan','zona-real','Nuevo Mexico','nuevo-mexico'),
  ('zapopan','zona-real','Tesistan','tesistan'),
  ('zapopan','zona-real','La Cima','la-cima'),
  ('zapopan','zona-real','Capital Norte','capital-norte'),
  ('zapopan','zona-real','Valle Imperial','valle-imperial'),
  -- Andares / Puerta de Hierro (Zapopan)
  ('zapopan','andares-puerta-de-hierro','Puerta de Hierro','puerta-de-hierro'),
  ('zapopan','andares-puerta-de-hierro','Royal Country','royal-country'),
  ('zapopan','andares-puerta-de-hierro','Colomos Patria','colomos-patria'),
  ('zapopan','andares-puerta-de-hierro','Virreyes Residencial','virreyes-residencial'),
  ('zapopan','andares-puerta-de-hierro','Puerta las Lomas','puerta-las-lomas'),
  ('zapopan','andares-puerta-de-hierro','Colinas Virreyes','colinas-virreyes'),
  ('zapopan','andares-puerta-de-hierro','Andares','andares'),
  ('zapopan','andares-puerta-de-hierro','Acueducto','acueducto'),
  ('zapopan','andares-puerta-de-hierro','Patria Universidad','patria-universidad'),
  ('zapopan','andares-puerta-de-hierro','Lomas del Bosque','lomas-del-bosque'),
  -- Chapalita / Ciudad Granja (Zapopan)
  ('zapopan','chapalita-ciudad-granja','Ciudad Granja','ciudad-granja'),
  ('zapopan','chapalita-ciudad-granja','Chapalita Inn','chapalita-inn'),
  ('zapopan','chapalita-ciudad-granja','Jardines de Chapalita','jardines-de-chapalita'),
  ('zapopan','chapalita-ciudad-granja','Chapalita Oriente','chapalita-oriente'),
  ('zapopan','chapalita-ciudad-granja','Chapalita Sur','chapalita-sur'),
  ('zapopan','chapalita-ciudad-granja','Jardines del Sol','jardines-del-sol'),
  ('zapopan','chapalita-ciudad-granja','La Estancia','la-estancia'),
  ('zapopan','chapalita-ciudad-granja','Ciudad del Sol','ciudad-del-sol'),
  -- Centro Zapopan
  ('zapopan','centro-zapopan','Zapopan Centro','zapopan-centro'),
  ('zapopan','centro-zapopan','La Villa','la-villa'),
  ('zapopan','centro-zapopan','Jardines de la Patria','jardines-de-la-patria'),
  ('zapopan','centro-zapopan','Jardines Universidad','jardines-universidad'),
  ('zapopan','centro-zapopan','Santa Isabel','santa-isabel'),
  ('zapopan','centro-zapopan','Jacarandas','jacarandas'),
  ('zapopan','centro-zapopan','Atemajac','atemajac'),
  -- Sur Zapopan
  ('zapopan','sur-zapopan','Miramar','miramar'),
  ('zapopan','sur-zapopan','Mariano Otero','mariano-otero'),
  ('zapopan','sur-zapopan','Las Aguilas','las-aguilas'),
  ('zapopan','sur-zapopan','Arenales Tapatios','arenales-tapatios'),
  ('zapopan','sur-zapopan','El Fortin','el-fortin'),
  ('zapopan','sur-zapopan','La Calma','la-calma'),
  ('zapopan','sur-zapopan','El Colli Urbano 1a. Seccion','el-colli-urbano-1a-seccion'),
  ('zapopan','sur-zapopan','Jardines Tapatios','jardines-tapatios'),
  -- Centro Guadalajara
  ('guadalajara','centro-guadalajara','Guadalajara Centro','guadalajara-centro'),
  ('guadalajara','centro-guadalajara','San Juan de Dios','san-juan-de-dios'),
  ('guadalajara','centro-guadalajara','Mexicaltzingo','mexicaltzingo'),
  ('guadalajara','centro-guadalajara','Analco','analco'),
  ('guadalajara','centro-guadalajara','La Perla','la-perla'),
  ('guadalajara','centro-guadalajara','El Santuario','el-santuario'),
  -- Americana / Chapultepec
  ('guadalajara','americana-chapultepec','Americana','americana'),
  ('guadalajara','americana-chapultepec','Moderna','moderna'),
  ('guadalajara','americana-chapultepec','Lafayette','lafayette'),
  ('guadalajara','americana-chapultepec','Arcos Vallarta','arcos-vallarta'),
  ('guadalajara','americana-chapultepec','Ninos Heroes','ninos-heroes'),
  ('guadalajara','americana-chapultepec','Ladron de Guevara','ladron-de-guevara'),
  -- Oblatos / Tetlan
  ('guadalajara','oblatos-tetlan','Oblatos','oblatos'),
  ('guadalajara','oblatos-tetlan','Tetlan','tetlan'),
  ('guadalajara','oblatos-tetlan','San Andres','san-andres'),
  ('guadalajara','oblatos-tetlan','San Joaquin','san-joaquin'),
  ('guadalajara','oblatos-tetlan','Lomas de Oblatos 1a Secc','lomas-de-oblatos-1a-secc'),
  ('guadalajara','oblatos-tetlan','Talpita Oriente','talpita-oriente'),
  -- Huentitan
  ('guadalajara','huentitan','Huentitan El Bajo','huentitan-el-bajo'),
  ('guadalajara','huentitan','Huentitan El Alto','huentitan-el-alto'),
  ('guadalajara','huentitan','Zoologico','zoologico'),
  ('guadalajara','huentitan','Balcones de Huentitan','balcones-de-huentitan'),
  ('guadalajara','huentitan','Colinas de Huentitan','colinas-de-huentitan'),
  -- Tlaquepaque
  ('tlaquepaque','centro-tlaquepaque','Centro Tlaquepaque','centro-tlaquepaque'),
  ('tlaquepaque','centro-tlaquepaque','El Refugio','el-refugio'),
  ('tlaquepaque','centro-tlaquepaque','San Pedro','san-pedro'),
  ('tlaquepaque','centro-tlaquepaque','Las Juntas','las-juntas'),
  ('tlaquepaque','revolucion-forum','San Pedrito','san-pedrito'),
  -- Tonala
  ('tonala','centro-tonala','Tonala Centro','tonala-centro'),
  ('tonala','centro-tonala','Santa Paula','santa-paula'),
  ('tonala','centro-tonala','Loma Dorada','loma-dorada'),
  ('tonala','centro-tonala','Jauja','jauja'),
  ('tonala','zona-artesanal-tonala','Zalatitan','zalatitan'),
  ('tonala','zona-artesanal-tonala','Santa Cruz de las Huertas','santa-cruz-de-las-huertas'),
  -- Tlajomulco
  ('tlajomulco','lopez-mateos-sur','Santa Anita','santa-anita'),
  ('tlajomulco','lopez-mateos-sur','La Rioja','la-rioja'),
  ('tlajomulco','lopez-mateos-sur','El Palomar','el-palomar'),
  ('tlajomulco','lopez-mateos-sur','Nueva Galicia','nueva-galicia'),
  ('tlajomulco','tlajomulco-centro','Tlajomulco Centro','tlajomulco-centro'),
  ('tlajomulco','tlajomulco-centro','Cajititlan','cajititlan');

-- 3) Inserta colonias que falten (con su municipio) ----------------------------
INSERT INTO neighborhoods (id, "municipalityId", name, slug, "isActive", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, m.id, x.name, x.slug, true, 0, now(), now()
FROM _zmap x
JOIN municipalities m ON m.slug = x.mun
WHERE NOT EXISTS (
  SELECT 1 FROM neighborhoods n WHERE n."municipalityId" = m.id AND n.slug = x.slug
);

-- 4) Enlaza cada colonia a su zona --------------------------------------------
UPDATE neighborhoods n
SET "zoneId" = z.id
FROM _zmap x
JOIN municipalities m ON m.slug = x.mun
JOIN zones z ON z."municipalityId" = m.id AND z.slug = x.zone
WHERE n."municipalityId" = m.id AND n.slug = x.slug;

DROP TABLE _zmap;

COMMIT;
