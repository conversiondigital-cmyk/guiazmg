import Link from "next/link"
import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Sparkles, Building2, Check, ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Emprendedor o Negocio | Guía ZMG",
  description: "Elige el tipo de perfil comercial: Emprendedor o Negocio.",
}

const cards = [
  {
    href: "/registrar-negocio?tipo=emprendedor",
    icon: Sparkles,
    badge: "Emprendedor",
    price: "$49",
    desc: "Vendo productos o servicios de forma recurrente, como persona independiente: desde casa, por pedido, por catálogo, por WhatsApp o sin local físico.",
    examples: ["Comida casera", "Pasteles", "Fruta", "Avon / Fuller", "Uñas", "Clases", "Costura", "Limpieza"],
    cta: "Crear perfil Emprendedor",
    accent: "border-green-300 bg-green-50/50",
    iconBg: "bg-green-700",
    ctaClass: "bg-green-700 hover:bg-green-800",
  },
  {
    href: "/registrar-negocio?tipo=negocio",
    icon: Building2,
    badge: "Negocio",
    price: "$149",
    desc: "Tengo un negocio, comercio, local o servicio profesional más establecido para captar clientes de forma continua.",
    examples: ["Cerrajero", "Plomero", "Veterinaria", "Dentista", "Taller", "Barbería", "Restaurante", "Estética"],
    cta: "Crear perfil Negocio",
    accent: "border-gray-200 bg-white",
    iconBg: "bg-slate-800",
    ctaClass: "bg-slate-900 hover:bg-slate-800",
  },
]

export default function VendedorPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <Link href="/onboarding" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="h-4 w-4" /> Volver
          </Link>
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900">¿Qué describe mejor tu actividad?</h1>
            <p className="mt-2 text-gray-500">Los dos tienen perfil público y catálogo. Elige el que más se parezca a ti.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {cards.map((c) => (
              <div key={c.href} className={`flex flex-col rounded-2xl border p-6 ${c.accent}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${c.iconBg}`}>
                    <c.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{c.badge}</p>
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-900">{c.price}</span> MXN/mes
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-gray-600">{c.desc}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.examples.map((e) => (
                    <span key={e} className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs text-gray-600 ring-1 ring-gray-200">
                      <Check className="h-3 w-3 text-green-600" /> {e}
                    </span>
                  ))}
                </div>

                <Link
                  href={c.href}
                  className={`mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${c.ctaClass}`}
                >
                  {c.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            ¿Solo quieres vender una cosa usada o algo temporal?{" "}
            <Link href="/marketplace/nuevo" className="underline hover:text-gray-600">Publica en Marketplace</Link> (gratis).
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
