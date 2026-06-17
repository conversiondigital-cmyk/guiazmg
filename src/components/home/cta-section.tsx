import Link from "next/link"
import { BarChart3 } from "lucide-react"

export function CTASection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-10">
      <div className="relative mx-auto flex max-w-[1280px] flex-col items-center gap-12 overflow-hidden rounded-[2rem] bg-[#064e3b] p-8 sm:p-12 md:flex-row">
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-[#6cf8bb]/20 blur-3xl" />

        {/* Left */}
        <div className="relative z-10 md:w-3/5">
          <h2 className="mb-6 text-4xl font-extrabold text-white md:text-5xl">¿Eres dueño de un negocio?</h2>
          <p className="mb-8 max-w-xl text-lg text-[#80bea6]">
            Aumenta tu visibilidad, llega a miles de clientes locales y haz crecer tu establecimiento
            con las herramientas de Guía ZMG.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/registrar-negocio"
              className="rounded-xl bg-[#6ffbbe] px-8 py-4 font-bold text-[#002113] transition-transform hover:scale-105 active:scale-95"
            >
              Registrar mi Negocio
            </Link>
            <Link
              href="/planes"
              className="rounded-xl border border-white/20 bg-white/10 px-8 py-4 font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Ver Planes
            </Link>
          </div>
        </div>

        {/* Right — dashboard mockup */}
        <div className="relative z-10 hidden md:block md:w-2/5">
          <div className="rotate-3 rounded-3xl bg-white p-6 shadow-2xl transition-transform duration-500 hover:rotate-0">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#b0f0d6]">
                <BarChart3 className="h-6 w-6 text-[#003527]" />
              </div>
              <div>
                <div className="mb-2 h-3 w-32 rounded-full bg-[#d3e4fe]" />
                <div className="h-2 w-20 rounded-full bg-[#e5eeff]" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-20 rounded-xl bg-[#eff4ff]" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 rounded-xl bg-[#eff4ff]" />
                <div className="h-12 rounded-xl bg-[#eff4ff]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
