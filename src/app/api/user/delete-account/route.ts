import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    // Corta los vínculos de acceso ANTES de anonimizar: si no, el Account de OAuth
    // (Google) sigue apuntando a este usuario ya inactivo y bloquea volver a entrar
    // o registrarse con el mismo Google. Al borrarlos, un futuro login con Google se
    // trata como cuenta NUEVA. También se borran las sesiones abiertas.
    await prisma.account.deleteMany({ where: { userId: session.user.id } })
    await prisma.session.deleteMany({ where: { userId: session.user.id } }).catch(() => {})

    // Cancela en Stripe cualquier suscripción de pago del usuario para NO seguir
    // cobrando tras borrar la cuenta (best-effort; no bloquea el borrado). Los
    // trials por cupón ("coupon:…") no son suscripciones, se ignoran.
    try {
      const memberships = await prisma.profileMembership.findMany({
        where: { profile: { ownerId: session.user.id }, provider: "STRIPE", providerSubscriptionId: { not: null } },
        select: { providerSubscriptionId: true },
      })
      const subs = memberships
        .map((m) => m.providerSubscriptionId)
        .filter((id): id is string => !!id && !id.startsWith("coupon:"))
      if (subs.length) {
        const stripe = await getStripe()
        if (stripe) {
          for (const id of subs) await stripe.subscriptions.cancel(id).catch(() => {})
        }
      }
    } catch (e) {
      console.error("[DELETE_ACCOUNT] stripe cancel:", e instanceof Error ? e.message : e)
    }

    // Desactiva (oculta) los negocios del usuario: salen del directorio público y
    // quedan marcados como borrados. No se hard-deletean para conservar registros
    // de pagos/auditoría asociados.
    const now = new Date()
    await prisma.profile.updateMany({
      where: { ownerId: session.user.id, deletedAt: null },
      data: { status: "INACTIVE", deletedAt: now },
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        sessionVersion: { increment: 1 },
        // Correo anonimizado ÚNICO: incluye el id del usuario para que, si la misma
        // persona vuelve a registrarse y borrar su cuenta, NO choque con el
        // "+deleted" de un borrado anterior (el email es único → daría P2002).
        email: `deleted+${session.user.id}@guiazmg.local`,
        name: null,
        image: null,
        passwordHash: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE_ACCOUNT]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "No se pudo eliminar la cuenta" }, { status: 500 })
  }
}
