import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, AlertCircle, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  title: "Promociones | Guía ZMG",
  description: "Descubre las promociones y ofertas especiales de negocios registrados en Guía ZMG.",
}

export default function PromocionesPage() {
  const promotions = [
    {
      id: 1,
      business: "Restaurante El Paraíso",
      title: "20% de descuento en cenas",
      description: "Aprovecha 20% de descuento en todas las cenas de lunes a jueves.",
      discount: "20%",
      validUntil: "2026-06-30",
      category: "Restaurantes",
      featured: true,
    },
    {
      id: 2,
      business: "Salón de Belleza Prestige",
      title: "Paquete facial + masaje",
      description: "Paquete completo de tratamiento facial con masaje relajante por solo $499.",
      discount: "35%",
      validUntil: "2026-07-15",
      category: "Belleza",
      featured: true,
    },
    {
      id: 3,
      business: "Clínica Dental Sonrisa",
      title: "Limpieza dental preventiva",
      description: "Sesión de limpieza con revisión completa. Primera sesión con 40% de descuento.",
      discount: "40%",
      validUntil: "2026-07-31",
      category: "Salud",
      featured: true,
    },
    {
      id: 4,
      business: "Gimnasio FitZone",
      title: "Membresía anual con 2 meses gratis",
      description: "Inscríbete ahora y obtén 2 meses adicionales gratuitos en tu membresía anual.",
      discount: "Gratis",
      validUntil: "2026-06-20",
      category: "Deportes",
      featured: false,
    },
    {
      id: 5,
      business: "Tienda de Electrónica TechHub",
      title: "Oferta especial en accesorios",
      description: "Compra 2 accesorios y obtén el tercero con 50% de descuento.",
      discount: "50%",
      validUntil: "2026-07-10",
      category: "Electrónica",
      featured: false,
    },
    {
      id: 6,
      business: "Academia de Inglés Smart English",
      title: "Clase de prueba gratuita",
      description: "Toma una clase de prueba sin costo y obtén 15% en tu inscripción si te registras esta semana.",
      discount: "15%",
      validUntil: "2026-06-15",
      category: "Educación",
      featured: false,
    },
  ]

  const featuredPromotions = promotions.filter((p) => p.featured)
  const regularPromotions = promotions.filter((p) => !p.featured)

  const isExpired = (date: string) => new Date(date) < new Date()

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-green-900 py-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{backgroundImage:"radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",backgroundSize:"60px 60px"}} />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">Exclusivo para ti</p>
              <h1 className="text-4xl font-black text-white sm:text-5xl">
                Promociones y Ofertas
              </h1>
              <p className="mt-4 text-xl text-green-200">
                Descubre las mejores promociones de negocios registrados en Guía ZMG
              </p>
            </div>
          </div>
        </section>

        {/* Featured Promotions */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Ofertas Destacadas</h2>
            <p className="mt-2 text-gray-600">Las promociones más atractivas del momento</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredPromotions.map((promo) => (
              <Card
                key={promo.id}
                className={`overflow-hidden transition-all hover:shadow-lg ${
                  isExpired(promo.validUntil) ? "opacity-60" : ""
                }`}
              >
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge className="mb-2 bg-blue-600">{promo.category}</Badge>
                      <CardTitle className="text-lg">{promo.title}</CardTitle>
                      <CardDescription className="mt-1 text-sm font-semibold text-gray-700">
                        {promo.business}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">{promo.discount}</div>
                      <div className="text-xs text-gray-600">descuento</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600">{promo.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-4 w-4" />
                      Válido hasta {new Date(promo.validUntil).toLocaleDateString("es-MX")}
                    </div>
                    {isExpired(promo.validUntil) && (
                      <Badge variant="destructive" className="text-xs">
                        Expirada
                      </Badge>
                    )}
                  </div>
                  <Button className="mt-4 w-full" variant={isExpired(promo.validUntil) ? "outline" : "default"}>
                    {isExpired(promo.validUntil) ? "Expirada" : "Ver detalle"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Regular Promotions */}
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight">Todas las Promociones</h2>
              <p className="mt-2 text-gray-600">Explora todas las ofertas disponibles</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {regularPromotions.map((promo) => (
                <Card key={promo.id} className={isExpired(promo.validUntil) ? "opacity-50" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {promo.category}
                        </Badge>
                        <CardTitle className="text-base">{promo.title}</CardTitle>
                        <CardDescription className="text-xs">{promo.business}</CardDescription>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{promo.discount}</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-600">{promo.description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {new Date(promo.validUntil).toLocaleDateString("es-MX")}
                      </span>
                      {isExpired(promo.validUntil) && (
                        <Badge variant="destructive" className="text-xs">
                          Expirada
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold">¿Eres dueño de un negocio?</h2>
            <p className="mt-4 text-lg text-gray-600">
              Promociona tus ofertas y atrae más clientes con Guía ZMG
            </p>
            <Button size="lg" className="mt-6">
              Registra tu negocio
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
