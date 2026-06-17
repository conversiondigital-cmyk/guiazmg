export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getVerificationMode } from "@/lib/verification-config"
import { VerificacionesClient } from "./verificaciones-client"

export default async function AdminVerificacionesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const [mode, pending] = await Promise.all([
    getVerificationMode(),
    prisma.profile.findMany({
      where: { verificationStatus: "PENDING", deletedAt: null },
      orderBy: { updatedAt: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        addressText: true,
        municipality: { select: { name: true } },
        owner: { select: { email: true, name: true } },
      },
    }),
  ])

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verificación de negocios</h1>
        <p className="text-sm text-muted-foreground">
          Elige el método de verificación y revisa las solicitudes pendientes.
        </p>
      </div>
      <VerificacionesClient
        initialMode={mode}
        pending={pending.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          phone: p.phone,
          address: p.addressText,
          municipality: p.municipality?.name ?? null,
          ownerEmail: p.owner?.email ?? null,
          ownerName: p.owner?.name ?? null,
        }))}
      />
    </div>
  )
}
