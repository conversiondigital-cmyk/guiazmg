import Link from "next/link"
import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Search, Store, Tag, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "¿Qué quieres hacer? | Guía ZMG",
  description: "Elige cómo quieres usar Guía ZMG: buscar, vender de forma recurrente o publicar algo temporal.",
}

const options = [
  {
    href: "/cuenta",
    icon: Search,
    title: "Quiero buscar negocios, productos o servicios",
    desc: "Encuentra negocios locales, guarda favoritos, contacta por WhatsApp, deja reseñas o compra en marketplace.",
    cta: "Explorar Guía ZMG",
    tone: "border-gray-200 hover:border-green-300",
  },
  {
    href: "/onboarding/vendedor",
    icon: Store,
    title: "Quiero vender u ofrecer algo de forma frecuente",
    desc: "Para quien vende productos, comida, catálogo (Avon, Fuller…), servicios, clases o atiende por WhatsApp.",
    cta: "Crear mi perfil",
    tone: "border-green-200 bg-green-50/40 hover:border-green-400",
    featured: true,
  },
  {
    href: "/marketplace/nuevo",
    icon: Tag,
    title: "Quiero vender una cosa o publicar algo temporal",
    desc: "Para vender algo usado, una venta de cochera, buscar algo o publicar una solicitud puntual.",
    cta: "Publicar en Marketplace",
    tone: "border-gray-200 hover:border-green-300",
  },
]

export default function OnboardingPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900">¿Qué quieres hacer en Guía ZMG?</h1>
            <p className="mt-2 text-gray-500">Elige una opción para empezar. Puedes cambiar más adelante.</p>
          </div>

          <div className="space-y-4">
            {options.map((o) => (
              <Link
                key={o.href}
                href={o.href}
                className={`flex items-center gap-5 rounded-2xl border bg-white p-5 transition-colors sm:p-6 ${o.tone}`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    o.featured ? "bg-green-700 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <o.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-gray-900">{o.title}</h2>
                  <p className="mt-0.5 text-sm text-gray-500">{o.desc}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-green-700">
                    {o.cta} <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
