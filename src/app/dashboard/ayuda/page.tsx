export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { HelpCircle, MessageCircle, Mail, ChevronRightIcon } from "@/lib/icons"
import Link from "next/link"

const faqs = [
  { q: "¿Cómo registro mi negocio?", a: "Ve a 'Mi Negocio' en el menú lateral y completa el formulario de registro. Una vez enviado, nuestro equipo revisará la información." },
  { q: "¿Cómo puedo promocionar mi negocio?", a: "Puedes activar Boosts para destacar tu negocio en búsquedas y anuncios. El cobro es directo por cada activación." },
  { q: "¿Qué es un Boost?", a: "Un Boost impulsa tu negocio para que aparezca en los primeros resultados de búsqueda por un tiempo determinado." },
  { q: "¿Cómo veo mis estadísticas?", a: "En la sección de Estadísticas encontrarás gráficas detalladas de vistas, contactos y leads generados por tus negocios." },
  { q: "¿Puedo cancelar mi membresía?", a: "Sí, puedes cancelar la renovación desde la sección de Membresía. Tu membresía seguirá activa hasta el final del período pagado." },
  { q: "¿Cómo respondo a una reseña?", a: "Ve a la sección de Reseñas, busca la reseña que deseas responder y da clic en 'Responder'." },
]

export default function AyudaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayuda</h1>
        <p className="text-gray-500">Encuentra respuestas y recursos para usar Guía ZMG</p>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            Preguntas frecuentes
          </CardTitle>
          <CardDescription>Las dudas más comunes de nuestros usuarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group rounded-lg border border-gray-200 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-lg">
                {faq.q}
                <ChevronRightIcon className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
                {faq.a}
              </div>
            </details>
          ))}
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            Contacto de soporte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿No encuentras lo que buscas? Contáctanos directamente y te ayudaremos.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="mailto:soporte@guiazmg.com"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:border-blue-200 hover:text-blue-600 transition-colors"
            >
              <Mail className="h-4 w-4" />
              soporte@guiazmg.com
            </Link>
            <Link
              href="https://wa.me/523312345678"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:border-green-200 hover:text-green-600 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
