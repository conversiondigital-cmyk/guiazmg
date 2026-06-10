import { Store, Users, Star, MapPin } from "lucide-react"
import { prisma } from "@/lib/prisma"

function formatCount(n: number): string {
  if (n >= 1000) return `+${Math.floor(n / 1000)}k`
  return `+${n}`
}

export async function StatsSection() {
  const [businesses, users, reviews, municipalities] = await Promise.all([
    prisma.profile.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.review.count(),
    prisma.municipality.count(),
  ])

  const stats = [
    { icon: Store,  value: formatCount(businesses),     label: "Negocios activos" },
    { icon: Users,  value: formatCount(users),          label: "Usuarios en la plataforma" },
    { icon: Star,   value: formatCount(reviews),        label: "Reseñas reales" },
    { icon: MapPin, value: municipalities.toString(),   label: "Municipios en la ZMG" },
  ]

  return (
    <section className="bg-gray-50 border-y border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100">
                  <Icon className="h-6 w-6 text-green-800" />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
