import { NextResponse } from "next/server"
import { getCategories } from "@/lib/queries"

export async function GET() {
  try {
    const categories = await getCategories()
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
  }
}
