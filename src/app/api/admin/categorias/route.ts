import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, icon } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        icon: icon || "📦",
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error("Error creating category:", error)
    return NextResponse.json(
      { error: error.message || "Error creating category" },
      { status: 500 }
    )
  }
}
