import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const salesAgent = await prisma.salesAgent.findUnique({
      where: { userId: session.user.id },
    })

    if (!salesAgent) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 })
    }

    const businesses = await prisma.business.findMany({
      where: { salesAgentId: salesAgent.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        whatsapp: true,
        owner: { select: { id: true, name: true } },
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const prospects = businesses.map((b) => ({
      id: `prospect-${b.id}`,
      name: b.owner?.name || "—",
      businessName: b.name,
      phone: b.phone || b.whatsapp || "",
      email: b.email || "",
      status: b.status === "ACTIVE" ? "CLIENTE" : "NUEVO",
      createdAt: b.createdAt.toISOString(),
      businessId: b.id,
    }))

    return NextResponse.json({ prospects })
  } catch (error) {
    console.error("[AGENT_PROSPECTS_GET]", error)
    return NextResponse.json({ error: "Error al obtener prospectos" }, { status: 500 })
  }
}

const createSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  businessName: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  status: z.string().optional().default("NUEVO"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const salesAgent = await prisma.salesAgent.findUnique({
      where: { userId: session.user.id },
    })

    if (!salesAgent) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
    }

    const { name, businessName, phone, email, notes, status } = parsed.data

    const prospect = await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: `PROSPECT_CREATE`,
        entityType: "Prospect",
        newValue: JSON.stringify({ name, businessName, phone, email, notes, status }),
      },
    })

    return NextResponse.json({
      prospect: {
        id: `prospect-${prospect.id}`,
        name,
        businessName,
        phone,
        email,
        notes,
        status,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error("[AGENT_PROSPECTS_POST]", error)
    return NextResponse.json({ error: "Error al crear prospecto" }, { status: 500 })
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1),
  name: z.string().optional(),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const salesAgent = await prisma.salesAgent.findUnique({
      where: { userId: session.user.id },
    })

    if (!salesAgent) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
    }

    const { id, status, ...rest } = parsed.data

    if (id.startsWith("prospect-")) {
      const businessId = id.replace("prospect-", "")
      const business = await prisma.business.findUnique({ where: { id: businessId } })
      if (business && business.salesAgentId === salesAgent.id) {
        if (status === "CLIENTE" && business.status !== "ACTIVE") {
          await prisma.business.update({
            where: { id: businessId },
            data: { status: "ACTIVE" },
          })
        }
      }

      await prisma.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "PROSPECT_UPDATE",
          entityType: "Prospect",
          entityId: businessId,
          newValue: JSON.stringify({ status, ...rest }),
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[AGENT_PROSPECTS_PATCH]", error)
    return NextResponse.json({ error: "Error al actualizar prospecto" }, { status: 500 })
  }
}
