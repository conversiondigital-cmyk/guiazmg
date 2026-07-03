import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Conteos de las colas de moderación que alimentan el badge de "Pendientes"
// en el menú lateral del admin. Solo cuenta lo que realmente requiere acción
// (estado PENDING / PENDING_REVIEW), no todo el histórico.
export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const [verifications, reviews, reports, claims, posts] = await Promise.all([
    prisma.profile.count({ where: { verificationStatus: "PENDING", deletedAt: null } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.profileClaimRequest.count({ where: { status: "PENDING" } }),
    prisma.post.count({ where: { status: "PENDING_REVIEW" } }),
  ])

  return NextResponse.json(
    { verifications, reviews, reports, claims, posts },
    { headers: { "Cache-Control": "no-store" } }
  )
}
