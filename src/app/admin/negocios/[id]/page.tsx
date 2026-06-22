import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { BusinessDetailClient } from "./business-detail-client"

export const dynamic = "force-dynamic"

async function getBusiness(id: string) {
  const business = await prisma.profile.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      category: { select: { id: true, name: true, slug: true } },
      subcategory: { select: { id: true, name: true, slug: true } },
      municipality: { select: { id: true, name: true, slug: true } },
      neighborhood: {
        select: {
          id: true,
          name: true,
          slug: true,
          municipality: { select: { id: true, name: true } },
        },
      },
      images: { select: { id: true, imageUrl: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
      memberships: {
        include: { plan: { select: { id: true, name: true, slug: true, monthlyPrice: true } } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { reviews: true, reports: true, leads: true } },
    },
  })

  if (!business) return null

  const leadEvents = await prisma.leadEvent.groupBy({
    by: ["eventType"],
    where: { businessId: id },
    _count: { id: true },
  })

  const analytics = {
    views: leadEvents.find((e) => e.eventType === "WEBSITE_VISIT")?._count.id ?? 0,
    whatsappClicks: leadEvents.find((e) => e.eventType === "WHATSAPP")?._count.id ?? 0,
    phoneClicks: leadEvents.find((e) => e.eventType === "PHONE_CALL")?._count.id ?? 0,
    websiteClicks: leadEvents.find((e) => e.eventType === "WEBSITE_VISIT")?._count.id ?? 0,
  }

  // El cliente muestra el historial; sin esto, business.auditLogs es undefined
  // y revienta con "Cannot read properties of undefined (reading 'length')".
  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: "Business", entityId: id },
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  return JSON.parse(
    JSON.stringify({
      ...business,
      analytics,
      auditLogs,
    })
  )
}

export default async function AdminNegocioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const { id } = await params
  const business = await getBusiness(id)

  if (!business) {
    notFound()
  }

  return <BusinessDetailClient business={business} />
}
