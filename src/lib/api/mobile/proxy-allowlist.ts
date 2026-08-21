// Copia deliberada (NO import) de la lógica de allowlist de `src/proxy.ts`,
// solo para poder testear el matcher de forma unitaria y pura.
//
// Por qué es una copia y no un import: la regla dura de la Fase B0 dice que
// `src/proxy.ts` se toca con una única línea (agregar "/api/mobile" a
// `publicPrefixPaths`) y nada más — ni siquiera exportar sus arrays internos
// para hacerlos testeables. Así que este archivo replica textualmente el
// array y la expresión de matching (`pathname === p || pathname.startsWith(p
// + "/")`) tal como quedaron en el proxy tras ese cambio. Si el array de
// `src/proxy.ts` cambia, este archivo debe actualizarse a mano para que el
// test siga verificando la realidad — no hay forma de que se desincronicen en
// silencio porque ambos son cortos y viven a un `grep` de distancia.
export const publicPrefixPaths = [
  "/perfil",
  "/categoria",
  "/preguntas",
  "/reclamar",
  "/usuario",
  "/eventos",
  "/blog",
  "/promociones",
  "/contacto",
  "/uploads",
  "/demo",
  "/api/auth",
  "/api/public",
  "/api/health",
  "/api/analytics",
  "/api/cron",
  "/api/mobile",
]

export const privatePrefixes = [
  "/dashboard",
  "/cuenta",
  "/admin",
  "/agente",
  "/editor",
  "/checkout",
  "/registrar-negocio",
  "/reportar",
  "/marketplace/nuevo",
]

// Misma expresión exacta que usa `src/proxy.ts` para decidir si un pathname
// hace match contra una lista de prefijos: igualdad exacta, o prefijo seguido
// de "/" (para que "/api/mobileX" NO haga match indebido contra "/api/mobile").
export function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

export function isPublicPrefixPath(pathname: string): boolean {
  return matchesPrefix(pathname, publicPrefixPaths)
}

// Réplica de `requiresAuth` del proxy: todo bajo /api/* requiere sesión
// EXCEPTO lo que ya cubre la allowlist pública de arriba (que se evalúa antes,
// en `src/proxy.ts`, con un `return` temprano).
export function requiresAuth(pathname: string): boolean {
  return pathname.startsWith("/api/") || matchesPrefix(pathname, privatePrefixes)
}
