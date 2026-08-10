import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Exige sesión Y aceptación de términos. El gate de consentimiento vivía solo en
// los layouts (/cuenta, /dashboard), así que una sesión "sin consentir" (registro
// con Google donde dieron "atrás") podía llamar las APIs mutantes directo. Este
// helper cierra ese hueco: úsalo en toda ruta que cree/mute datos del usuario.
export async function requireConsent(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, status: 401, error: "No autorizado" }
  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { acceptedTermsAt: true },
  })
  if (!u?.acceptedTermsAt) {
    return { ok: false, status: 403, error: "Debes aceptar los Términos y el Aviso de Privacidad para continuar." }
  }
  return { ok: true, userId: session.user.id }
}
