import { HelpCircle, MessageCircle, BookOpen, Phone } from "lucide-react"
import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Ayuda | Guía ZMG" }

const FAQ = [
  { q: "¿Cómo guardo un negocio como favorito?", a: "En la página de cualquier negocio, haz clic en el ícono de corazón para guardarlo en tus favoritos." },
  { q: "¿Cómo dejo una reseña?", a: "Visita la página del negocio y desplázate hasta la sección de reseñas. Debes estar registrado para poder dejar una." },
  { q: "¿Cómo publico en el marketplace?", a: 'Ve a Marketplace en el menú principal y haz clic en "Publicar". Puedes vender, intercambiar o pedir productos y servicios.' },
  { q: "¿Cómo creo una solicitud de servicio?", a: "Ve a Solicitudes en tu cuenta y describe lo que necesitas. Los negocios registrados podrán responderte." },
  { q: "¿Puedo registrar mi negocio?", a: 'Sí. Haz clic en "Registrar mi negocio" en el menú lateral. Tenemos planes desde $49 MXN/mes.' },
]

export default function AyudaPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-green-700" />
          Centro de ayuda
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Resuelve tus dudas sobre Guía ZMG</p>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Preguntas frecuentes", href: "/preguntas", icon: BookOpen, desc: "Respuestas a las dudas más comunes" },
          { label: "Contáctanos",          href: "/contacto",  icon: MessageCircle, desc: "Escríbenos por cualquier motivo" },
          { label: "WhatsApp",             href: "https://wa.me/523348843477", icon: Phone, desc: "Soporte directo por WhatsApp" },
        ].map(({ label, href, icon: Icon, desc }) => (
          <Link key={href} href={href} className="rounded-2xl bg-white border border-gray-100 p-5 hover:border-green-200 hover:shadow-md transition-all group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-700 mb-3 group-hover:bg-green-100 transition-colors">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="font-bold text-gray-900 text-sm">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>

      {/* FAQ */}
      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Preguntas frecuentes</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="px-6 py-4">
              <p className="font-semibold text-gray-900 text-sm">{q}</p>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
