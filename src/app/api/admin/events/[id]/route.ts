import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  return session?.user?.id && session.user.role === "ADMIN" ? session : null
}

function parseEventBody(body: Record<string, unknown>) {
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)
  const num = (v: unknown) => (v === "" || v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null)
  const date = (v: unknown) => {
    if (!v) return null
    const d = new Date(String(v))
    return isNaN(d.getTime()) ? null : d
  }
  const data: Record<string, unknown> = {}
  if ("title" in body) data.title = str(body.title)
  if ("description" in body) data.description = str(body.description)
  if ("startAt" in body) data.startAt = date(body.startAt)
  if ("endAt" in body) data.endAt = date(body.endAt)
  if ("venueName" in body) data.venueName = str(body.venueName)
  if ("addressText" in body) data.addressText = str(body.addressText)
  if ("municipalityId" in body) data.municipalityId = str(body.municipalityId)
  if ("latitude" in body) data.latitude = num(body.latitude)
  if ("longitude" in body) data.longitude = num(body.longitude)
  if ("category" in body) data.category = str(body.category)
  if ("isFree" in body) data.isFree = Boolean(body.isFree)
  if ("priceText" in body) data.priceText = str(body.priceText)
  if ("ticketUrl" in body) data.ticketUrl = str(body.ticketUrl)
  if ("sourceUrl" in body) data.sourceUrl = str(body.sourceUrl)
  if ("organizer" in body) data.organizer = str(body.organizer)
  if ("coverImageUrl" in body) data.coverImageUrl = str(body.coverImageUrl)
  if ("isPublished" in body) data.isPublished = Boolean(body.isPublished)
  if ("isFeatured" in body) data.isFeatured = Boolean(body.isFeatured)
  return data
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const data = parseEventBody(body)
  if ("title" in data && !data.title) return NextResponse.json({ error: "El título no puede quedar vacío" }, { status: 400 })
  if ("startAt" in data && !data.startAt) return NextResponse.json({ error: "Fecha de inicio inválida" }, { status: 400 })

  try {
    const event = await prisma.event.update({ where: { id }, data })
    revalidatePath(`/eventos/${event.slug}`)
    return NextResponse.json({ event })
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el evento" }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  try {
    const ev = await prisma.event.update({ where: { id }, data: { deletedAt: new Date(), isPublished: false }, select: { slug: true } })
    revalidatePath(`/eventos/${ev.slug}`)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 404 })
  }
}
