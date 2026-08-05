import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MEMBERSHIP_PLANS } from "@/lib/constants"
import { Gift, Check, ArrowRight, MapPin, Star, ShoppingBag, Zap, Crown } from "@/lib/icons"

export const metadata: Metadata = {
  title: "60 días gratis al registrar tu negocio",
  description:
    "Registra tu negocio en Guía ZMG y activa tu plan Emprendedor o Negocio gratis por 60 días con tu código de invitación. Aparece donde la gente de tu zona busca.",
}

// Contenido estático (promo + descripción). ISR 10 min.
export const revalidate = 600

const emp = MEMBERSHIP_PLANS.EMPRENDIMIENTO
const neg = MEMBERSHIP_PLANS.NEGOCIO

export default function PromoRegistroPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero de la promo */}
        <section className="bg-gradient-to-b from-[#f0faf6] to-white">
          <div className="mx-auto max-w-5xl px-4 py-14 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#006c49] px-4 py-1.5 text-sm font-semibold text-white">
              <Gift className="h-4 w-4" />
              Promoción de lanzamiento
            </span>
            <h1 className="mt-5 text-3xl font-bold text-gray-900 sm:text-4xl">
              60 días gratis al registrar tu negocio
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Activa tu plan <strong>Emprendedor</strong> o <strong>Negocio</strong> sin pagar los
              primeros 60 días. Solo necesitas tu <strong>código de invitación</strong>.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-[#006c49] text-white hover:bg-[#00583b]">
                <Link href="/registrar-negocio">
                  Registrar mi negocio <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard/membresia">Ya tengo cuenta, canjear código</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Válido para los planes Emprendedor y Negocio. Cupos limitados.
            </p>
          </div>
        </section>

        {/* Qué es Guía ZMG */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-center text-2xl font-bold text-gray-900">¿Qué es Guía ZMG?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-center text-gray-600">
            Guía ZMG es el <strong>directorio local de negocios, servicios y productos</strong> de la
            Zona Metropolitana de Guadalajara. Conectamos a las personas con negocios establecidos y
            emprendedores de su zona. Para ti como dueño, es la forma de{" "}
            <strong>aparecer justo donde la gente busca</strong> y recibir clientes.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MapPin, title: "Apareces en tu zona", desc: "Tu negocio visible por colonia, municipio y categoría." },
              { icon: ShoppingBag, title: "Catálogo propio", desc: "Publica tus productos y servicios con fotos y precios." },
              { icon: Star, title: "Reseñas y confianza", desc: "Tus clientes te califican y te recomiendan." },
              { icon: Zap, title: "Contacto directo", desc: "WhatsApp, teléfono, mapa y horarios en un solo lugar." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6f4ee]">
                  <f.icon className="h-5 w-5 text-[#006c49]" />
                </span>
                <h3 className="mt-3 font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Los dos planes de la promo */}
        <section className="bg-[#f7faf9]">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 className="text-center text-2xl font-bold text-gray-900">
              Elige tu plan y pruébalo 60 días gratis
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {[
                { plan: emp, icon: Zap, accent: "border-[#006c49]/30" },
                { plan: neg, icon: Crown, accent: "border-amber-300" },
              ].map(({ plan, icon: Icon, accent }) => (
                <div key={plan.slug} className={`flex flex-col rounded-2xl border-2 bg-white p-6 ${accent}`}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-[#006c49]" />
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{plan.tagline}</p>
                  <p className="mt-3">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-sm text-gray-500"> MXN/mes</span>
                    <span className="ml-2 rounded-full bg-[#e6f4ee] px-2 py-0.5 text-xs font-semibold text-[#006c49]">
                      60 días gratis
                    </span>
                  </p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {plan.features.slice(0, 5).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#006c49]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo se aplica */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-center text-2xl font-bold text-gray-900">¿Cómo obtengo mis 60 días?</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              { n: 1, title: "Regístrate", desc: "Crea tu perfil de negocio en Guía ZMG. Es rápido y sin costo de alta." },
              { n: 2, title: "Elige tu plan", desc: "Selecciona Emprendedor o Negocio, el que mejor se adapte a ti." },
              { n: 3, title: "Canjea tu código", desc: "En tu Panel → Membresía, ingresa tu código y activa 60 días gratis." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#006c49] text-lg font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-3 font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button asChild size="lg" className="bg-[#006c49] text-white hover:bg-[#00583b]">
              <Link href="/registrar-negocio">
                Empezar ahora <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-3 text-xs text-gray-400">
              ¿No tienes un código? Escríbenos y con gusto te ayudamos.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
