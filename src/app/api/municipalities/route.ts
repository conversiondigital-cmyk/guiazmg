import { NextResponse } from "next/server"
import { getMunicipalities } from "@/lib/queries"

export async function GET() {
  try {
    const municipalities = await getMunicipalities()
    return NextResponse.json(municipalities)
  } catch {
    return NextResponse.json({ error: "Error al obtener municipios" }, { status: 500 })
  }
}
