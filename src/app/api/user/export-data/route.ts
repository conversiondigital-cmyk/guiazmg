import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      isActive: true,
      acceptedTermsAt: true,
      acceptedPrivacyAt: true,
      acceptedCommunityAt: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      businesses: true,
      reviews: true,
      favorites: true,
      marketplaceListings: true,
      businessClaims: true,
      userSettings: true,
      searchLogs: true,
      emailLogs: true,
    },
  })

  return NextResponse.json({ success: true, data: user })
}
