import { notFound } from "next/navigation"

export async function safeQuery<T>(
  fn: () => Promise<T>,
  errorMessage = "Error al cargar datos"
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    console.error(`[ADMIN_ERROR] ${errorMessage}:`, error)
    return null
  }
}

export function handleError(error: any) {
  console.error("[ADMIN_ERROR]", error)
  notFound()
}
