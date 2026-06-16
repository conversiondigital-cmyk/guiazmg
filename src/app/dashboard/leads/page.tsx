export const dynamic = "force-dynamic"

import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Phone, MessageCircle, MapPin, Globe, ExternalLink, Music2 } from "@/lib/icons"

const LEAD_SOURCE_ICONS: Record<string, any> = {
  WHATSAPP: MessageCircle,
  PHONE: Phone,
  PHONE_CALL: Phone,
  MAP: MapPin,
  WEBSITE: Globe,
  ROUTE: MapPin,
  FACEBOOK: MessageCircle,
  INSTAGRAM: ExternalLink,
  TIKTOK: Music2,
}

const LEAD_TYPE_COLORS: Record<string, string> = {
  WHATSAPP: "bg-green-100 text-green-700",
  PHONE_CALL: "bg-orange-100 text-orange-700",
  ROUTE: "bg-red-100 text-red-700",
  WEBSITE: "bg-purple-100 text-purple-700",
  FORM: "bg-green-100 text-green-800",
}

export default async function LeadsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const businesses = await prisma.profile.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  })
  const businessIds = businesses.map((b) => b.id)

  const leads = businessIds.length > 0
    ? await prisma.lead.findMany({
        where: { businessId: { in: businessIds } },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          profile: { select: { name: true } },
          listing: { select: { title: true } },
        },
      })
    : []

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const last7 = new Date(today)
  last7.setDate(last7.getDate() - 7)
  const last30 = new Date(today)
  last30.setDate(last30.getDate() - 30)

  const leadsToday = leads.filter((l) => l.createdAt >= today)
  const leads7d = leads.filter((l) => l.createdAt >= last7)
  const leads30d = leads.filter((l) => l.createdAt >= last30)

  const typeCounts = leads.reduce((acc: Record<string, number>, l: any) => {
    acc[l.type] = (acc[l.type] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-500">Todos los contactos generados por tus negocios</p>
      </div>

      {/* Quick filters */}
      <div className="flex items-center gap-2">
        <Badge className="bg-green-100 text-green-800 cursor-pointer hover:bg-green-200">Hoy ({leadsToday.length})</Badge>
        <Badge className="bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200">7 días ({leads7d.length})</Badge>
        <Badge className="bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200">30 días ({leads30d.length})</Badge>
        <Badge className="bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200">Todos ({leads.length})</Badge>
      </div>

      {/* Type breakdown */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Object.entries(typeCounts).map(([type, count]) => {
          const Icon = LEAD_SOURCE_ICONS[type] || Users
          return (
            <Link key={type} href="/dashboard/leads" className="block">
              <Card className="h-full transition-shadow hover:border-green-200 hover:shadow-md">
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{type}</p>
                    <p className="text-lg font-bold">{Number(count)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Leads table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial de leads</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aún no tienes leads</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-3 pr-4 font-medium">Fecha</th>
                    <th className="pb-3 pr-4 font-medium">Tipo</th>
                    <th className="pb-3 pr-4 font-medium">Origen</th>
                    <th className="pb-3 pr-4 font-medium">Negocio</th>
                    <th className="pb-3 font-medium">Anuncio</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const Icon = LEAD_SOURCE_ICONS[lead.source] || Users
                    return (
                      <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                          {new Date(lead.createdAt).toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge className={LEAD_TYPE_COLORS[lead.type] || "bg-gray-100 text-gray-600"}>
                            {lead.type}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center gap-1 text-gray-600">
                            <Icon className="h-3 w-3" />
                            {lead.source}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-medium text-gray-900">{lead.profile.name}</td>
                        <td className="py-3 text-gray-500">{lead.listing?.title || "—"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
