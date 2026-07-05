import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Código duplicado (P2002) detectado por el código del error: el namespace Prisma
// del cliente generado es solo-tipo (@ts-nocheck).
function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: unknown }).code === "P2002"
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") return null
  return session
}

const createSchema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/, "Solo letras, números, - y _"),
  planId: z.string().min(1),
  days: z.coerce.number().int().min(1).max(3650),
  maxRedemptions: z.coerce.number().int().min(1).max(100000).nullable().optional(),
  expiresAt: z.string().min(1).nullable().optional(),
  note: z.string().max(200).optional(),
})

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  const coupons = await prisma.membershipCoupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { plan: { select: { name: true, slug: true } } },
  })
  return NextResponse.json({ coupons })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 })
  }
  const { code, planId, days, maxRedemptions, expiresAt, note } = parsed.data

  const plan = await prisma.membershipPlan.findUnique({ where: { id: planId }, select: { id: true } })
  if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 400 })

  let expiry: Date | null = null
  if (expiresAt) {
    const d = new Date(expiresAt)
    if (isNaN(d.getTime())) return NextResponse.json({ error: "Fecha de expiración inválida" }, { status: 400 })
    expiry = d
  }

  try {
    const coupon = await prisma.membershipCoupon.create({
      data: {
        code: code.toUpperCase(),
        planId,
        days,
        maxRedemptions: maxRedemptions ?? null,
        expiresAt: expiry,
        note: note || null,
      },
    })
    await prisma.auditLog
      .create({
        data: {
          actorUserId: session.user.id,
          action: "CREATE_MEMBERSHIP_COUPON",
          entityType: "MembershipCoupon",
          entityId: coupon.id,
          newValue: JSON.stringify({ code: coupon.code, planId, days }),
        },
      })
      .catch(() => {})
    return NextResponse.json({ success: true, coupon }, { status: 201 })
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "Ya existe un cupón con ese código" }, { status: 400 })
    }
    console.error("[ADMIN_MEMBERSHIP_COUPONS_POST]", error)
    return NextResponse.json({ error: "No se pudo crear el cupón" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const id = String(body?.id ?? "")
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })
  await prisma.membershipCoupon
    .update({ where: { id }, data: { isActive: Boolean(body?.isActive) } })
    .catch(() => {})
  return NextResponse.json({ success: true })
}
