import { Store, Users, Star, MapPin } from "lucide-react"

const STATS = [
  { icon: Store,  value: "+15,000",   label: "Negocios registrados" },
  { icon: Users,  value: "+250,000",  label: "Usuarios en la plataforma" },
  { icon: Star,   value: "+50,000",   label: "Reseñas reales" },
  { icon: MapPin, value: "+30",       label: "Municipios en la ZMG" },
]

export function StatsSection() {
  return (
    <section className="bg-gray-50 border-y border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((s) => {
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
