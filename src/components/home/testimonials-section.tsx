import { Card, CardContent } from "@/components/ui/card"
import { Star, MessageCircle } from "@/lib/icons"

const testimonials = [
  {
    name: "María García",
    business: "Dental Care Chapalita",
    text: "Gracias a Guía ZMG he recibido más de 20 pacientes nuevos en mi consultorio. La plataforma es muy fácil de usar y mis pacientes me encuentran rápido.",
    rating: 5,
  },
  {
    name: "Carlos López",
    business: "Taller Mecánico El Chaparral",
    text: "Desde que me registré en Guía ZMG, mi teléfono no deja de sonar. La gente encuentra mi taller cuando más lo necesita. Excelente plataforma.",
    rating: 5,
  },
  {
    name: "Ana Martínez",
    business: "Veterinaria Providencia",
    text: "Lo mejor es que los clientes pueden verme en el mapa y contactarme directo por WhatsApp. He duplicado mis clientes en 3 meses.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white">Lo que dicen nuestros usuarios</h2>
          <p className="mt-2 text-lg text-blue-100">
            Negocios reales, resultados reales
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-blue-100 leading-relaxed mb-4">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-medium">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{t.name}</p>
                    <p className="text-blue-200 text-xs">{t.business}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a
            href="/registrar-negocio"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Únete a los que ya crecen con Guía ZMG
          </a>
        </div>
      </div>
    </section>
  )
}
