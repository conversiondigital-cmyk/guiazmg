import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Get all system settings
    const allSettings = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    })

    // Group by section (simple heuristic based on key prefix)
    const grouped: Record<string, any[]> = {}
    allSettings.forEach((s) => {
      const section = s.key.split("_")[0] || "general"
      if (!grouped[section]) grouped[section] = []
      grouped[section].push({
        key: s.key,
        value: s.value.substring(0, 50) + (s.value.length > 50 ? "..." : ""),
        updatedAt: s.updatedAt,
      })
    })

    return NextResponse.json({
      total: allSettings.length,
      bySection: grouped,
      settings: allSettings,
    })
  } catch (error) {
    console.error("[TEST_SETTINGS]", error)
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
