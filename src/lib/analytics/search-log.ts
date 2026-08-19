import { prisma } from "@/lib/prisma"

interface LogSearchInput {
  query: string
  municipality?: string | null
  neighborhood?: string | null
  resultsCount?: number
  userId?: string | null
}

// Registra una búsqueda en `search_logs` para el panel de analítica
// ("Top búsquedas" / "Top categorías buscadas"). Fire-and-forget: nunca lanza, así
// que no rompe el render de /search. Solo debe llamarse con query no vacío y para la
// primera página (evita inflar el conteo con la paginación).
export async function logSearchQuery(input: LogSearchInput): Promise<void> {
  const q = input.query.trim()
  if (!q) return
  try {
    await prisma.searchLog.create({
      data: {
        query: q.slice(0, 200),
        municipality: input.municipality || null,
        neighborhood: input.neighborhood || null,
        userId: input.userId || null,
        resultsCount: input.resultsCount ?? 0,
      },
    })
  } catch (error) {
    console.error("[SEARCH_LOG_ERROR]", error instanceof Error ? error.message : String(error))
  }
}
