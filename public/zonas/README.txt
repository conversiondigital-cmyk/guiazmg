IMÁGENES CARACTERÍSTICAS DE CADA ZONA
=====================================

Cada landing de zona (p. ej. /zapopan/zona-real) usa una imagen de fondo que
identifica visualmente a esa zona.

CÓMO PONER LA IMAGEN DE UNA ZONA
--------------------------------
Coloca un archivo .jpg con el slug de la zona, dentro de la carpeta del municipio:

  public/zonas/{municipio}/{zona}.jpg

Ejemplos:
  public/zonas/zapopan/zona-real.jpg
  public/zonas/zapopan/andares-puerta-de-hierro.jpg
  public/zonas/guadalajara/americana-chapultepec.jpg

Recomendado: 1600x900 px aprox., horizontal, algo representativo de la zona
(una plaza, una avenida reconocible, un punto de referencia). Se muestra atenuada
detrás del título, así que no importa si es un poco oscura.

SI NO PONES IMAGEN
------------------
La landing muestra un degradado verde de respaldo. No se rompe nada.

OVERRIDE POR ADMIN (opcional)
-----------------------------
Si en el futuro defines "heroImageUrl" de la zona (columna en la tabla `zones`,
p. ej. una URL de R2), esa imagen tiene prioridad sobre el archivo local.

Las colonias sin imagen propia heredan la imagen de su zona.
