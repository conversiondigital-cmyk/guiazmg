import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Devuelve el SalesAgent de la sesión actual, o null si la cuenta no es agente
// (p. ej. un ADMIN viendo el panel). Las páginas de /agente lo usan para acotar
// sus consultas a los negocios/comisiones del agente.
export async function getCurrentAgent() {
  const session = await auth()
  if (!session?.user?.id) return null
  return prisma.salesAgent.findUnique({ where: { userId: session.user.id } })
}
