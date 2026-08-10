import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { WelcomeConsent } from "@/components/auth/welcome-consent"

export const dynamic = "force-dynamic"

// Bienvenida tras el registro con Google. Si el usuario ya aceptó términos (por
// ejemplo un login recurrente), entra directo a su destino; si es su primer
// ingreso (sin aceptar), muestra sus datos y pide aceptar para continuar.
export default async function BienvenidoPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, acceptedTermsAt: true },
  })
  if (!user) redirect("/auth/login")

  // Solo se permiten destinos internos (evita open-redirect). Se rechaza `//` y
  // también `\` / `%5c`: los navegadores normalizan `\`→`/`, así que `/\evil.com`
  // se volvería protocol-relative (//evil.com) y saldría del sitio.
  const dest =
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.includes("\\") &&
    !next.toLowerCase().includes("%5c")
      ? next
      : "/cuenta"
  if (user.acceptedTermsAt) redirect(dest)

  return <WelcomeConsent name={user.name} email={user.email ?? ""} next={dest} />
}
