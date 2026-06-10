import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const editableFields = new Set([
  "name",
  "slug",
  "shortDescription",
  "description",
  "phone",
  "whatsapp",
  "email",
  "websiteUrl",
  "googleMapsUrl",
  "addressText",
  "postalCode",
  "latitude",
  "longitude",
  "categoryId",
  "municipalityId",
  "neighborhoodId",
])

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const isEditor = session.user.role === "EDITOR"

    const { id } = await params
    const body = await request.json()
    const { action, ...fields } = body

    if (isEditor && !action) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const business = await prisma.profile.findUnique({
      where: { id },
    })

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    }

    if (action) {
      if (isEditor && !["APPROVE", "REJECT"].includes(action)) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }

      let updateData: Record<string, any> = {}
      let actionLabel = action

      switch (action) {
        case "APPROVE":
          updateData = { status: "ACTIVE" }
          break
        case "REJECT":
          updateData = { status: "REJECTED" }
          break
        case "SUSPEND":
          updateData = { status: "SUSPENDED" }
          break
        case "ACTIVATE":
          updateData = { status: "ACTIVE" }
          break
        case "VERIFY": {
          updateData = {
            isVerified: true,
            verificationStatus: "VERIFIED",
          }
          break
        }
        case "UNVERIFY":
          updateData = {
            isVerified: false,
            verificationStatus: "UNVERIFIED",
          }
          break
        case "FEATURE":
          updateData = { isFeatured: !business.isFeatured }
          actionLabel = business.isFeatured ? "UNFEATURE" : "FEATURE"
          break
        default:
          return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
      }

      const updated = await prisma.profile.update({
        where: { id },
        data: updateData,
      })

      await prisma.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: actionLabel,
          entityType: "Business",
          entityId: id,
          oldValue: JSON.stringify({
            status: business.status,
            isVerified: business.isVerified,
            isFeatured: business.isFeatured,
            verificationStatus: business.verificationStatus,
          }),
          newValue: JSON.stringify({
            status: updated.status,
            isVerified: updated.isVerified,
            isFeatured: updated.isFeatured,
            verificationStatus: updated.verificationStatus,
          }),
        },
      })

      return NextResponse.json(updated)
    }

    const oldValues: Record<string, any> = {}
    const changedFields: Record<string, any> = {}

    for (const [key, value] of Object.entries(fields)) {
      if (!editableFields.has(key)) continue
      if (value !== undefined && (business as any)[key] !== value) {
        oldValues[key] = (business as any)[key]
        changedFields[key] = key === "latitude" || key === "longitude" ? (value === "" ? null : Number(value)) : value
      }
    }

    if (Object.keys(changedFields).length === 0) {
      return NextResponse.json(business)
    }

    const updated = await prisma.profile.update({
      where: { id },
      data: changedFields,
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "EDIT",
        entityType: "Business",
        entityId: id,
        oldValue: JSON.stringify(oldValues),
        newValue: JSON.stringify(changedFields),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[ADMIN_BUSINESS_PUT]", error)
    return NextResponse.json({ error: "Error al actualizar negocio" }, { status: 500 })
  }
}
