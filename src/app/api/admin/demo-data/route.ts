import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDemoDataStatus, enableDemoData, disableDemoData } from "@/lib/demo-data"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }
  return NextResponse.json(await getDemoDataStatus())
}

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { enabled } = await req.json()
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "El parámetro 'enabled' debe ser booleano" }, { status: 400 })
    }

    const affected = enabled ? await enableDemoData() : await disableDemoData()
    const status = await getDemoDataStatus()
    return NextResponse.json({ ...status, affected })
  } catch (error) {
    console.error("[admin/demo-data] failed:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al cambiar los datos demo" },
      { status: 500 }
    )
  }
}
