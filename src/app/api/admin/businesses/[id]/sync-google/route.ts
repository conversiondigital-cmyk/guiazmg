import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { syncGoogleRating } from "@/lib/google/places"

export const runtime = "nodejs"

// Sincroniza el rating de Google de UN negocio (botón manual en el admin).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const { id } = await params
  const result = await syncGoogleRating(id)
  if (result.skipped) {
    return NextResponse.json(
      { ok: false, error: "Falta la API key de Google Places (Admin → Config → Google Maps)." },
      { status: 400 }
    )
  }
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ ok: true, rating: result.rating, count: result.count })
}
