import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      isActive: false,
      deletedAt: new Date(),
      sessionVersion: { increment: 1 },
      email: `${session.user.email || session.user.id}+deleted@guiazmg.local`,
      name: null,
      image: null,
      passwordHash: null,
    },
  })

  return NextResponse.json({ success: true })
}
