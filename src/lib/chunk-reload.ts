// Tras un despliegue, los chunks de JS del build anterior dejan de existir. Una
// pestaña que quedó abierta con el build viejo, al navegar por el cliente, intenta
// pedir esos chunks y revienta con "ChunkLoadError" (lo atrapa el error boundary y
// muestra "Algo salió mal"). Esta función detecta ese caso y recarga la página UNA
// vez para tomar el build nuevo, con un guard por tiempo en sessionStorage para no
// entrar en bucle si la recarga no lo resuelve (ahí sí se muestra el error real).
export function reloadOnChunkError(error: unknown): boolean {
  if (typeof window === "undefined") return false
  const e = error as { name?: string; message?: string } | null
  const text = `${e?.name ?? ""} ${e?.message ?? ""}`
  const isChunkError =
    /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to load chunk|error loading dynamically imported module|Importing a module script failed/i.test(
      text,
    )
  if (!isChunkError) return false
  try {
    const KEY = "chunk-reload-at"
    const last = Number(sessionStorage.getItem(KEY) || "0")
    // Si ya recargamos hace menos de 10s, no volvemos a hacerlo (evita bucle).
    if (Date.now() - last < 10000) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    /* sessionStorage bloqueado (modo privado, etc.): recargamos de todos modos */
  }
  window.location.reload()
  return true
}
