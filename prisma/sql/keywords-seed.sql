-- Siembra de keywords para TODAS las categorías (buscador Fase 2).
-- Las keywords se suman al search_vector (peso B) de los negocios de cada
-- categoría, para que términos coloquiales/sinónimos ("birria", "pastor",
-- "vulcanizadora", "gym") encuentren los negocios correctos.
--
-- Idempotente: se puede correr varias veces sin efecto secundario.
-- Coincide por nombre (ILIKE, tolerante a acentos/plurales).

UPDATE categories SET keywords = 'comida restaurante restaurantes taco tacos taqueria taquerias pastor asada suadero birria carnitas barbacoa pozole menudo tortas torta hamburguesa hamburguesas pizza sushi mariscos antojitos fonda cocina economica desayunos comida corrida cafe cafeteria pan panaderia pasteleria pastel postres reposteria carniceria fruteria verduleria' WHERE name ILIKE 'aliment%';

UPDATE categories SET keywords = 'servicio servicios cerrajero cerrajeros cerrajeria plomero plomeros fontanero fontaneria electricista electricistas jardineria jardinero limpieza aseo intendencia mecanico mecanicos reparacion mantenimiento tecnico instalacion' WHERE name ILIKE 'servicio%';

UPDATE categories SET keywords = 'tienda tiendas compras comercio ropa boutique moda calzado zapatos electronica celulares telefonos computadoras muebles muebleria regalos novedades mercado abarrotes miscelanea papeleria' WHERE name ILIKE 'compra%';

UPDATE categories SET keywords = 'profesional profesionales abogado abogados legal juridico notario contador contadores contabilidad fiscal impuestos arquitecto arquitectos ingeniero ingenieros diseñador diseño grafico fotografo fotografos fotografia consultor asesor' WHERE name ILIKE 'profesional%';

UPDATE categories SET keywords = 'entretenimiento diversion cine cines pelicula gimnasio gimnasios gym parque parques bar bares antro antros cantina cerveceria eventos fiesta salon boliche billar karaoke' WHERE name ILIKE 'entreten%';

UPDATE categories SET keywords = 'educacion escuela escuelas colegio primaria secundaria preparatoria universidad curso cursos clases idiomas ingles frances tutoria tutorias regularizacion guarderia guarderias kinder estancia biblioteca capacitacion diplomado' WHERE name ILIKE 'educaci%';

UPDATE categories SET keywords = 'hogar casa mantenimiento mudanza mudanzas fletes flete decoracion interiorismo seguridad alarmas camaras cctv plomeria pintura pintor tapiceria carpinteria cerrajeria remodelacion' WHERE name ILIKE 'hogar%';

UPDATE categories SET keywords = 'belleza salon estetica peluqueria barberia barber barbero spa masaje masajes uñas uñas acrilicas manicure pedicure maquillaje depilacion cejas pestañas facial' WHERE name ILIKE 'belleza%';

UPDATE categories SET keywords = 'mascota mascotas veterinaria veterinario perro perros gato gatos paseador tienda estetica canina peluqueria guarderia adopcion alimento croquetas pet accesorios' WHERE name ILIKE 'mascota%';

UPDATE categories SET keywords = 'construccion obra arquitecto ingeniero civil materiales cemento varilla remodelacion remodelaciones ampliacion electricidad plomeria pintura albañil herreria soldadura acabados yeso tablaroca' WHERE name ILIKE 'construcci%';

UPDATE categories SET keywords = 'salud medico medicos doctor doctora clinica consultorio hospital urgencias dentista dental odontologo ortodoncia veterinaria farmacia optica lentes oftalmologo psicologo psicologia terapia nutriologo laboratorio analisis' WHERE name ILIKE 'salud%';

UPDATE categories SET keywords = 'automotriz auto autos carro coche vehiculo taller talleres mecanico mecanica llantera llantas vulcanizadora lavado autolavado encerado refacciones refaccionaria autopartes venta agencia seminuevos grua gruas hojalateria pintura afinacion balatas frenos' WHERE name ILIKE 'automotriz%';

-- Re-dispara el trigger de search_vector en TODOS los negocios para que hereden
-- las keywords recién asignadas a su categoría. (El trigger corre BEFORE UPDATE
-- OF "categoryId"; asignarle su mismo valor lo activa sin cambiar datos.)
UPDATE businesses SET "categoryId" = "categoryId";
