IMÁGENES DE FONDO DE CADA ZONA
==============================

Cada landing de zona (p. ej. /zapopan/zona-real) y las tarjetas de /zonas usan
una foto de fondo representativa de esa zona.

ESTADO ACTUAL
-------------
Ya hay una foto real por zona, descargada de Wikimedia Commons (licencia libre),
del punto icónico/referente de cada una (Basílica de Zapopan, Catedral de GDL,
Templo Expiatorio, El Parián de Tlaquepaque, Barranca de Huentitán, cerámica de
Tonalá, etc.). Los créditos (autor + licencia) están en CREDITS.md.

CÓMO CAMBIAR LA FOTO DE UNA ZONA (por la tuya)
----------------------------------------------
Reemplaza el archivo:

  public/zonas/{municipio}/{zona}.jpg

Ejemplos:
  public/zonas/zapopan/zona-real.jpg
  public/zonas/guadalajara/americana-chapultepec.jpg

Recomendado: horizontal, ~1600x900 px. Se muestra atenuada detrás del título
(scrim oscuro a la izquierda), así que no importa si es luminosa.

Regenerar todas desde Commons:  node scripts/fetch-zone-images.mjs

OVERRIDE POR ADMIN
------------------
En Admin → Zonas puedes poner una "URL de imagen" (heroImageUrl) que tiene
prioridad sobre el archivo local.

Las colonias sin imagen propia heredan la imagen de su zona.
