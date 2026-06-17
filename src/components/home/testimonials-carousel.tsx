import { Star, StarHalf } from "lucide-react"

const TESTIMONIALS = [
  {
    quote:
      "Gracias a Guía ZMG encontré un especialista dental increíble cerca de mi casa en Zapopan. La plataforma es súper intuitiva.",
    name: "Ricardo Mendoza",
    role: "Usuario Verificado",
    avatar: "#95d3ba",
    full: 5,
  },
  {
    quote:
      "Como dueño de restaurante, estar en Guía ZMG ha sido nuestra mejor decisión. Hemos visto un incremento real en visitas.",
    name: "Mariana Ortiz",
    role: "Dueña de Negocio",
    avatar: "#6ffbbe",
    full: 5,
  },
  {
    quote:
      "Excelente para descubrir lugares nuevos el fin de semana. Las calificaciones y fotos de otros usuarios ayudan mucho.",
    name: "Daniela Vega",
    role: "Usuaria Explorer",
    avatar: "#ffb4a9",
    full: 4,
    half: true,
  },
]

export function TestimonialsCarousel() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
        <h2 className="mb-16 text-center text-3xl font-bold text-[#003527] sm:text-[32px]">
          Lo que dice nuestra comunidad
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-[#bfc9c3]/10 bg-[#f8f9ff] p-8 shadow-sm">
              <div className="mb-4 flex text-[#006c49]">
                {Array.from({ length: t.full }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-[#006c49]" />
                ))}
                {t.half && <StarHalf className="h-5 w-5 fill-[#006c49]" />}
              </div>
              <p className="mb-6 italic text-[#404944]">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full" style={{ backgroundColor: t.avatar }} />
                <div>
                  <p className="font-semibold text-[#0b1c30]">{t.name}</p>
                  <p className="text-xs text-[#404944]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
