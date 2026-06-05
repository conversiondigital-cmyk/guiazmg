import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Store, Search, Star } from "@/lib/icons"

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              ¿Tienes un negocio en la ZMG?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Llega a más clientes. Regístra tu negocio gratis y comienza a recibir
              clientes potenciales de personas que buscan tus servicios.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: Store, text: "Perfil público con toda tu información" },
                { icon: Search, text: "Aparece en las búsquedas hiperlocales" },
                { icon: Star, text: "Recibe reseñas y calificaciones" },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-blue-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-blue-50 rounded-xl px-8"
                >
                  Registrar mi negocio gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/planes">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8"
                >
                  Ver planes
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-2xl bg-white/5 p-8 backdrop-blur-sm">
              <div className="space-y-4">
                {[
                  { label: "Usuarios activos", value: "10,000+" },
                  { label: "Negocios registrados", value: "1,500+" },
                  { label: "Búsquedas mensuales", value: "50,000+" },
                  { label: "Municipios cubiertos", value: "8" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between rounded-xl bg-white/10 px-6 py-4"
                  >
                    <span className="text-blue-100">{stat.label}</span>
                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
