// Paginación compartida por todos los endpoints de colección de la API móvil.
// `z.coerce` porque los query params siempre llegan como string ("page=2"), y
// así el mismo schema sirve tal cual con `searchParams` sin parseInt manual.
import { z } from "zod"

export const mobilePaginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(200).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type MobilePagination = z.infer<typeof mobilePaginationSchema>

// `hasMore`: true si después de esta página todavía queda al menos un registro
// más por servir. Con `total` desconocido (p. ej. no se corrió el COUNT) se
// puede omitir del meta en vez de forzar un valor engañoso.
export function computeHasMore(page: number, limit: number, total: number): boolean {
  return page * limit < total
}

// --- Paginación por cursor (feeds / listados que crecen mientras el usuario
// scrollea, donde offset/página se desincroniza si se inserta contenido nuevo) ---
//
// El cursor codifica el punto exacto donde se quedó el cliente: fecha de
// creación + id (el id desempata registros con el mismo timestamp). Se manda
// como base64url para que sea un solo string opaco en la URL/query param, sin
// caracteres que haya que escapar.

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/")
  const withPadding = padded + "=".repeat((4 - (padded.length % 4)) % 4)
  return Buffer.from(withPadding, "base64").toString("utf8")
}

export function encodeCursor(createdAt: Date, id: string): string {
  return base64UrlEncode(`${createdAt.toISOString()}|${id}`)
}

export interface DecodedCursor {
  createdAt: Date
  id: string
}

// Devuelve `null` en vez de lanzar si el cursor viene corrupto o manipulado
// (un cliente viejo/hostil no debe poder tumbar el endpoint con un 500).
export function decodeCursor(cursor: string): DecodedCursor | null {
  try {
    const decoded = base64UrlDecode(cursor)
    const separatorIndex = decoded.indexOf("|")
    if (separatorIndex === -1) return null

    const isoDate = decoded.slice(0, separatorIndex)
    const id = decoded.slice(separatorIndex + 1)
    if (!isoDate || !id) return null

    const createdAt = new Date(isoDate)
    if (Number.isNaN(createdAt.getTime())) return null

    return { createdAt, id }
  } catch {
    return null
  }
}
