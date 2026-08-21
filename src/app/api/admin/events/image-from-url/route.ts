import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { importRemoteImageToWebp } from "@/lib/images/import-remote"

export const dynamic = "force-dynamic"
export const maxDuration = 30

// Admin: "copia" una imagen desde su URL de origen y la re-aloja como WebP propio
// en R2 (no hotlink). Devuelve la URL hosteada para guardarla en coverImageUrl.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>)
  const url = typeof body.url === "string" ? body.url.trim() : ""
  if (!url) {
    return NextResponse.json({ error: "URL requerida" }, { status: 400 })
  }

  const hosted = await importRemoteImageToWebp(url, "events")
  if (!hosted) {
    return NextResponse.json(
      { error: "No se pudo copiar la imagen. Verifica que la URL apunte a una imagen pública (JPG, PNG, GIF o WebP)." },
      { status: 422 },
    )
  }

  return NextResponse.json({ url: hosted })
}
