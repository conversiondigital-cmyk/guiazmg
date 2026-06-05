import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadFile } from "@/lib/storage"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Formato no soportado. Usa JPG, PNG, WebP o GIF" }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Archivo muy grande. Máximo 5MB" }, { status: 400 })
  }

  const folder = String(formData.get("folder") || "general")
  try {
    const result = await uploadFile(file, {
      folder,
      allowedTypes: allowedTypes,
      maxSizeBytes: 5 * 1024 * 1024,
    })

    return NextResponse.json({ url: result.url, key: result.key, provider: result.provider })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al subir archivo" },
      { status: 500 }
    )
  }
}
