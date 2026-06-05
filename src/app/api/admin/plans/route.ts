export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const plans = await prisma.membershipPlan.findMany({
      orderBy: { priorityLevel: "asc" },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Error fetching plans:", error)
    return NextResponse.json({ error: "Error al obtener planes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    const plan = await prisma.membershipPlan.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        monthlyPrice: body.monthlyPrice,
        priorityLevel: body.priorityLevel ?? 0,
        maxListings: body.maxListings ?? 1,
        maxGalleryImages: body.maxGalleryImages ?? 5,
        hasFeaturedBadge: body.hasFeaturedBadge ?? false,
        hasSocialLinks: body.hasSocialLinks ?? false,
        hasWebsiteLink: body.hasWebsiteLink ?? false,
        isActive: body.isActive ?? true,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "create",
        entityType: "MembershipPlan",
        entityId: plan.id,
        newValue: JSON.stringify(body),
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("Error creating plan:", error)
    return NextResponse.json({ error: "Error al crear plan" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        monthlyPrice: data.monthlyPrice,
        priorityLevel: data.priorityLevel,
        maxListings: data.maxListings,
        maxGalleryImages: data.maxGalleryImages,
        hasFeaturedBadge: data.hasFeaturedBadge,
        hasSocialLinks: data.hasSocialLinks,
        hasWebsiteLink: data.hasWebsiteLink,
        isActive: data.isActive,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "update",
        entityType: "MembershipPlan",
        entityId: id,
        newValue: JSON.stringify(data),
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("Error updating plan:", error)
    return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    await prisma.membershipPlan.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "delete",
        entityType: "MembershipPlan",
        entityId: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting plan:", error)
    return NextResponse.json({ error: "Error al eliminar plan" }, { status: 500 })
  }
}
