import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uniqueEventSlug } from "@/lib/events"

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
  return {
    title: str(body.title),
    description: str(body.description),
    startAt: date(body.startAt),
    endAt: date(body.endAt),
    venueName: str(body.venueName),
    addressText: str(body.addressText),
    municipalityId: str(body.municipalityId),
    latitude: num(body.latitude),
    longitude: num(body.longitude),
    category: str(body.category),
    isFree: body.isFree === undefined ? true : Boolean(body.isFree),
    priceText: str(body.priceText),
    ticketUrl: str(body.ticketUrl),
    sourceUrl: str(body.sourceUrl),
    organizer: str(body.organizer),
    coverImageUrl: str(body.coverImageUrl),
    isPublished: body.isPublished === undefined ? true : Boolean(body.isPublished),
    isFeatured: Boolean(body.isFeatured),
  }
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const events = await prisma.event.findMany({
    where: { deletedAt: null },
    orderBy: { startAt: "desc" },
    take: 200,
  })
  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const data = parseEventBody(body)
  if (!data.title) return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 })
  if (!data.startAt) return NextResponse.json({ error: "La fecha de inicio es obligatoria" }, { status: 400 })

  const slug = await uniqueEventSlug(data.title)
  const event = await prisma.event.create({
    data: {
      ...data,
      title: data.title,
      startAt: data.startAt,
      slug,
      source: "manual",
      createdById: session.user.id,
    },
  })
  revalidatePath(`/eventos/${event.slug}`)
  return NextResponse.json({ event })
}
