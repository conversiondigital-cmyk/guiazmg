import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { uploadFile, deleteFile } from "@/lib/storage"
import { getHeroImages, setHeroImages } from "@/lib/hero-images"
import { getHeroConfig, setHeroConfig } from "@/lib/hero-config"

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX = 8 * 1024 * 1024

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const [images, config] = await Promise.all([getHeroImages(), getHeroConfig()])
  return NextResponse.json({ images, config })
}

// Guarda el contenido del hero (textos y búsquedas populares).
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const config = await setHeroConfig(body?.config ?? body)
  revalidatePath("/")
  return NextResponse.json({ config })
}

// Sube una imagen y la agrega al final del carrusel.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Formato no soportado. Usa JPG, PNG, WebP o GIF" }, { status: 400 })
    }
    if (file.size > MAX) {
      return NextResponse.json({ error: "Archivo muy grande. Máximo 8MB" }, { status: 400 })
    }

    const result = await uploadFile(file, { folder: "hero", allowedTypes: ALLOWED, maxSizeBytes: MAX })
    // Guardamos la ruta RELATIVA (portátil entre hosts).
    const rel = `/uploads/${result.key}`
    const images = await getHeroImages()
    images.push(rel)
    await setHeroImages(images)
    revalidatePath("/")
    return NextResponse.json({ images })
  } catch (error) {
    console.error("[ADMIN_HERO_POST]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al subir la imagen" },
      { status: 500 }
    )
  }
}

// Reemplaza la lista ordenada completa (para reordenar).
export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (!Array.isArray(body.images)) {
    return NextResponse.json({ error: "images debe ser un arreglo" }, { status: 400 })
  }
  const images = body.images.filter((x: unknown): x is string => typeof x === "string")
  await setHeroImages(images)
  revalidatePath("/")
  return NextResponse.json({ images })
}

// Quita una imagen del carrusel y borra el archivo local.
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const url = String(body.url || "")
  if (!url) return NextResponse.json({ error: "url requerida" }, { status: 400 })
  const images = (await getHeroImages()).filter((x) => x !== url)
  await setHeroImages(images)
  await deleteFile(url).catch(() => {})
  revalidatePath("/")
  return NextResponse.json({ images })
}
