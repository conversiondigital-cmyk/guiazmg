const TESTIMONIALS = [
  {
    quote: "Encontré el mejor restaurante italiano gracias a Guía ZMG. La información es súper completa y confiable.",
    name: "María González",
    location: "Guadalajara, Jalisco",
    initials: "MG",
    color: "bg-green-100 text-green-800",
  },
  {
    quote: "He conseguido muchos clientes para mi negocio desde que estoy en Guía ZMG. 100% recomendaría la plataforma.",
    name: "Carlos Ramírez",
    location: "Zapopan, Jalisco",
    initials: "CR",
    color: "bg-blue-100 text-blue-800",
  },
  {
    quote: "Me encanta que pueda encontrar todo lo que necesito en un solo lugar. ¡Es súper fácil de usar!",
    name: "Ana López",
    location: "Tlaquepaque, Jalisco",
    initials: "AL",
    color: "bg-amber-100 text-amber-800",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
            Lo que dicen nuestros usuarios
          </p>
          <h2 className="text-3xl font-black text-gray-900">
            Historias reales de nuestra comunidad
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4"
            >
              {/* Quote mark */}
              <span className="text-5xl font-black text-green-100 leading-none select-none">"</span>

              <p className="text-gray-600 leading-relaxed text-sm -mt-4">
                {t.quote}
              </p>

              <div className="mt-auto flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${t.color}`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
