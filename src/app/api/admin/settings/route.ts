import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ADMIN_CONFIG_SECTIONS, SECRET_KEYS } from "@/lib/admin-config-fields"

// Build SETTING_KEY_MAP from config sections
const SETTING_KEY_MAP: Record<string, { key: string; label: string; section: string }> = {}
Object.entries(ADMIN_CONFIG_SECTIONS).forEach(([section, config]) => {
  config.fields.forEach((field) => {
    SETTING_KEY_MAP[field.key] = {
      key: field.key,
      label: field.label,
      section,
    }
  })
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const allKeys = Object.keys(SETTING_KEY_MAP)
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: allKeys } },
    })

    const grouped: Record<string, { key: string; label: string; value: string; hasValue: boolean; description: string | null }[]> = {}

    for (const meta of Object.values(SETTING_KEY_MAP)) {
      const setting = settings.find((s) => s.key === meta.key)
      const stored = setting?.value ?? ""
      const isSecret = SECRET_KEYS.has(meta.key)

      if (!grouped[meta.section]) grouped[meta.section] = []
      grouped[meta.section].push({
        key: meta.key,
        label: meta.label,
        // Un secreto nunca sale al cliente en claro; solo se informa si existe.
        value: isSecret ? "" : stored,
        hasValue: stored !== "",
        description: setting?.description ?? null,
      })
    }

    const lastUpdated = await prisma.systemSetting.findFirst({
      where: { key: { in: allKeys } },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    })

    return NextResponse.json({
      settings: grouped,
      lastUpdated: lastUpdated?.updatedAt ?? null,
    })
  } catch (error) {
    console.error("[ADMIN_SETTINGS_GET]", error)
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ error: "Key requerida" }, { status: 400 })
    }

    const meta = Object.values(SETTING_KEY_MAP).find((m) => m.key === key)
    if (!meta) {
      return NextResponse.json({ error: "Configuración no válida" }, { status: 400 })
    }

    if (typeof value !== "string") {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 })
    }

    const isSecret = SECRET_KEYS.has(key)

    // Un secreto con valor vacío NO se guarda: se conserva el existente. Evita
    // que el formulario (que reenvía todos los campos) borre una key al dejar
    // el input en blanco.
    if (isSecret && value.trim() === "") {
      return NextResponse.json({ skipped: true })
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, isSecret },
      create: { key, value, isSecret, description: meta.label },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "UPDATE_SETTING",
        entityType: "SystemSetting",
        entityId: setting.id,
        newValue: JSON.stringify({ key }),
      },
    })

    return NextResponse.json({ setting })
  } catch (error) {
    console.error("[ADMIN_SETTINGS_PUT]", error)
    return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 })
  }
}
