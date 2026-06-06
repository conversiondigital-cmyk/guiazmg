import { ShieldCheck, Zap, Tag, MapPin } from "lucide-react"

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Información confiable",
    desc: "Negocios verificados y reseñas reales de clientes como tú.",
    color: "bg-green-100 text-green-700",
  },
  {
    icon: Zap,
    title: "Encuentra rápido",
    desc: "Busca por categoría, ubicación o nombre y encuentra lo que necesitas en segundos.",
    color: "bg-amber-100 text-amber-700",
  },
  {
    icon: Tag,
    title: "Promociones exclusivas",
    desc: "Descubre ofertas especiales y promociones solo para nuestra comunidad.",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: MapPin,
    title: "Apoya lo local",
    desc: "Conectamos contigo los mejores negocios de la Zona Metropolitana.",
    color: "bg-rose-100 text-rose-700",
  },
]

export function BenefitsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
            ¿Por qué elegir Guía ZMG?
          </p>
          <h2 className="text-3xl font-black text-gray-900">
            Beneficios que hacen la diferencia
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => {
            const Icon = b.icon
            return (
              <div key={b.title} className="flex flex-col items-center text-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-3xl ${b.color}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
