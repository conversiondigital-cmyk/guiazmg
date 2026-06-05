import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const agents = await prisma.salesAgent.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, image: true, isActive: true } },
        _count: { select: { businesses: true, commissions: true } },
        commissions: {
          select: { amount: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const data = agents.map((agent) => ({
      id: agent.id,
      userId: agent.userId,
      commissionPercentage: Number(agent.commissionPercentage),
      isActive: agent.isActive,
      createdAt: agent.createdAt,
      user: agent.user,
      businessesCount: agent._count.businesses,
      commissionsCount: agent._count.commissions,
      pendingCommissions: agent.commissions
        .filter((c) => c.status === "PENDING")
        .reduce((sum, c) => sum + Number(c.amount), 0),
      totalCommissions: agent.commissions.reduce((sum, c) => sum + Number(c.amount), 0),
    }))

    const activeAgents = agents.filter((a) => a.isActive).length
    const totalClients = agents.reduce((sum, a) => sum + a._count.businesses, 0)
    const pendingCommissionsTotal = agents.reduce(
      (sum, a) =>
        sum +
        a.commissions
          .filter((c) => c.status === "PENDING")
          .reduce((s, c) => s + Number(c.amount), 0),
      0
    )

    return NextResponse.json({
      agents: data,
      stats: {
        activeAgents,
        totalClients,
        pendingCommissions: pendingCommissionsTotal,
      },
    })
  } catch (error) {
    console.error("[ADMIN_SALES_AGENTS_GET]", error)
    return NextResponse.json({ error: "Error al obtener agentes" }, { status: 500 })
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  commissionPercentage: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
    }

    const { id, commissionPercentage, isActive } = parsed.data

    const updateData: Record<string, any> = {}
    if (commissionPercentage !== undefined) updateData.commissionPercentage = commissionPercentage
    if (isActive !== undefined) updateData.isActive = isActive

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Sin datos para actualizar" }, { status: 400 })
    }

    const agent = await prisma.salesAgent.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "UPDATE_SALES_AGENT",
        entityType: "SalesAgent",
        entityId: id,
        newValue: JSON.stringify(updateData),
      },
    })

    return NextResponse.json({ agent })
  } catch (error) {
    console.error("[ADMIN_SALES_AGENTS_PUT]", error)
    return NextResponse.json({ error: "Error al actualizar agente" }, { status: 500 })
  }
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  commissionPercentage: z.number().min(0).max(100).default(10),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
    }

    const { name, email, password, commissionPercentage } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "SALES_AGENT",
        isActive: true,
        salesAgent: {
          create: { commissionPercentage },
        },
      },
      include: {
        salesAgent: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "CREATE_SALES_AGENT",
        entityType: "SalesAgent",
        entityId: user.salesAgent!.id,
        newValue: JSON.stringify({ name, email, commissionPercentage }),
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("[ADMIN_SALES_AGENTS_POST]", error)
    return NextResponse.json({ error: "Error al crear agente" }, { status: 500 })
  }
}
