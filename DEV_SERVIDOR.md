# Entorno de desarrollo en el servidor Linux

Esta copia vive en `/home/manager/guiazmg` (disco local del servidor). **No es la copia
principal.** La principal está en `/mnt/e/GuiaZMG`, sobre un recurso compartido SMB de la PC
Windows, y es la que se despliega a producción (`guiazmg.com`).

## Por qué existe esta copia

Tres problemas del montaje SMB la hicieron necesaria:

1. **`node_modules` traía binarios de Windows** (`sharp-win32-x64`,
   `lightningcss-win32-x64-msvc`). En Linux falta `lightningcss.linux-x64-gnu.node` y
   `next build` no arranca. Reinstalar allá habría roto el flujo de trabajo en Windows,
   porque es la misma carpeta.
2. **`.next` se queda bloqueado** (`EBUSY` / "Device or resource busy") — CIFS no libera los
   directorios y el build no puede limpiar su caché.
3. **Escrituras pequeñas ~3× más lentas**, y un proyecto Expo instala decenas de miles de
   archivos.

## Sincronizar con la copia principal

El remoto `pc` apunta a la copia de la PC:

```bash
git remote -v
#   pc      /mnt/e/GuiaZMG                                    (la copia principal)
#   origin  https://github.com/b3417/guiazmg.git
#   cmyk    https://github.com/conversiondigital-cmyk/guiazmg.git

git fetch pc                      # traer cambios hechos desde Windows
git push pc feat/app-movil        # devolver el trabajo hecho aquí
```

> `master` es producción. Nada se promueve sin revisión humana.

## Base de datos local

No hay acceso a Docker (el usuario no está en el grupo `docker` y `sudo` pide contraseña),
así que corre una instancia de PostgreSQL 16 **en espacio de usuario**, en el puerto **5434**
para no chocar con los Postgres de otros proyectos que ya ocupan 5432 y 5433.

```bash
export PGBIN=/usr/lib/postgresql/16/bin
export PGDATA=/home/manager/pgdata-guiazmg

# arrancar
"$PGBIN/pg_ctl" -D "$PGDATA" \
  -o "-p 5434 -c listen_addresses=127.0.0.1 -c unix_socket_directories=/tmp" \
  -l "$PGDATA/server.log" start

# estado / detener
"$PGBIN/pg_isready" -h 127.0.0.1 -p 5434 -U root
"$PGBIN/pg_ctl" -D "$PGDATA" stop

# consola
PGPASSWORD=root "$PGBIN/psql" -h 127.0.0.1 -p 5434 -U root -d guiazmg
```

Extensiones requeridas (ya instaladas): `pg_trgm` (la usa un índice GIN del buscador) y
`unaccent`.

El esquema se aplicó con `npx prisma db push` sobre una base **vacía**, más `npm run seed:base`.

> ⚠️ `db push`, `migrate dev` y `migrate reset` son seguros **aquí y solo aquí**, porque esta
> base es local y desechable. **Nunca** contra producción: el historial de migraciones está
> desincronizado (2 archivos para ~70 modelos) y esos comandos querrían hacer un reset.

## Verificado en este entorno

- `npm run typecheck` → exit 0
- `npm run build` → **exit 0 con `mobile/` presente en el repo**, que es el criterio de
  aceptación de la fase A0: la app móvil no rompe el build del sitio.

## Puertos ocupados en el servidor (para no pisarlos)

| Puerto | Qué es |
|---|---|
| 3000 | `next-server` de **n8n-dashboard** (otro proyecto) — no tocar |
| 3001, 3002, 3350 | otros servicios del ecosistema |
| 5432, 5433 | Postgres de otros proyectos |
| **5434** | **Postgres de Guía ZMG (este)** |
| 3100 | libre — el dev server de este sitio |

Regla de higiene: matar servidores **por puerto** (`fuser -k <puerto>/tcp`), nunca con
`pkill -f`, que puede matar el propio shell que ejecuta el comando.
