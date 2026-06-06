import Link from "next/link"
import { Rocket, BadgeCheck, Star } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-20 bg-green-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">

          {/* Left */}
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 mb-6">
              <Rocket className="h-7 w-7 text-amber-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              ¿Tienes un negocio?{" "}
              <span className="text-amber-400">Hazlo crecer con Guía ZMG</span>
            </h2>
            <p className="mt-4 text-lg text-green-200 leading-relaxed">
              Únete a nuestra plataforma y llega a miles de clientes
              que buscan productos y servicios como los tuyos.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/registrar-negocio"
                className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-400 transition-colors"
              >
                Agregar mi negocio
              </Link>
              <Link
                href="/planes"
                className="rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                Conocer planes
              </Link>
            </div>
          </div>

          {/* Right — Example business card */}
          <div className="hidden lg:block">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-white">Tu negocio destacado</p>
                <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                  Patrocinado
                </span>
              </div>
              <div className="rounded-xl bg-white p-4 flex gap-4 items-start">
                <div className="h-16 w-16 shrink-0 rounded-xl bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                  <span className="text-2xl font-black text-amber-700">C</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">Café La Estación</h3>
                  <div className="flex items-center gap-1 my-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">4.9 (128)</span>
                  </div>
                  <p className="text-xs text-gray-500">Guadalajara, Jalisco</p>
                  <div className="flex items-center gap-1 mt-1">
                    <BadgeCheck className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">Verificado</span>
                    <span className="mx-1 text-gray-300">·</span>
                    <span className="text-xs text-green-600 font-medium">Abierto ahora</span>
                  </div>
                </div>
              </div>
              <Link
                href="/registrar-negocio"
                className="mt-4 block w-full rounded-xl bg-green-700 py-3 text-center text-sm font-bold text-white hover:bg-green-600 transition-colors"
              >
                Ver perfil del negocio
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
