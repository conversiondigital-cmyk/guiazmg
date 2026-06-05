import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const SETTING_KEY_MAP: Record<string, { key: string; label: string; section: string }> = {
  site_name: { key: "site_name", label: "Nombre del sitio", section: "general" },
  site_logo_url: { key: "site_logo_url", label: "URL del logo", section: "general" },
  site_favicon_url: { key: "site_favicon_url", label: "URL del favicon", section: "general" },
  support_email: { key: "support_email", label: "Email de soporte", section: "general" },
  support_phone: { key: "support_phone", label: "Teléfono de soporte", section: "general" },
}

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

    const grouped: Record<string, { key: string; label: string; value: string; description: string | null }[]> = {}

    for (const meta of Object.values(SETTING_KEY_MAP)) {
      const setting = settings.find((s) => s.key === meta.key)
      const value = setting?.value ?? ""

      if (!grouped[meta.section]) grouped[meta.section] = []
      grouped[meta.section].push({
        key: meta.key,
        label: meta.label,
        value,
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

    if (value.trim() === "") {
      return NextResponse.json({ error: "Valor vacío no permitido" }, { status: 400 })
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, isSecret: false },
      create: { key, value, isSecret: false, description: meta.label },
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
