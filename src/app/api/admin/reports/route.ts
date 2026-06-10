import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ReportStatus } from "@/generated/prisma/enums"

const allowedRoles = ["ADMIN", "EDITOR"]

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user || !allowedRoles.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const reason = searchParams.get("reason")
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20))

  const where: Record<string, unknown> = {}
  if (status && status !== "ALL") {
    where.status = status
  }
  if (reason) {
    where.reason = reason
  }

  const [reports, total, reasons] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        profile: { select: { id: true, name: true, slug: true } },
        listing: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.report.count({ where }),
    prisma.report.findMany({
      distinct: ["reason"],
      select: { reason: true },
    }),
  ])

  return NextResponse.json({
    reports,
    reasons: reasons.map((r) => r.reason),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user || !allowedRoles.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: "ID y estado requeridos" }, { status: 400 })
    }

    const validStatuses = [
      ReportStatus.PENDING,
      ReportStatus.INVESTIGATING,
      ReportStatus.RESOLVED,
      ReportStatus.DISMISSED,
    ]
    if (!validStatuses.includes(status as any)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 })
    }

    const updated = await prisma.report.update({
      where: { id },
      data: { status: status as ReportStatus },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Error al actualizar reporte" }, { status: 500 })
  }
}
