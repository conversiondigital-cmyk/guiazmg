import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, User, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog | Guía ZMG",
  description: "Lee artículos y consejos para emprendedores y dueños de negocios en Guadalajara.",
}

export default function BlogPage() {
  const articles = [
    {
      id: 1,
      title: "5 consejos para mejorar la presencia digital de tu negocio",
      excerpt:
        "En la era digital, es fundamental que tu negocio tenga una presencia en línea fuerte. Descubre los 5 consejos más importantes para lograrlo.",
      author: "Carlos Mendoza",
      date: "2026-06-01",
      category: "Marketing Digital",
      readTime: "5 min",
      featured: true,
      slug: "presencia-digital-negocios",
    },
    {
      id: 2,
      title: "Cómo atraer y retener clientes en tu restaurante",
      excerpt:
        "La competencia en el sector gastronómico es fuerte. Aprende estrategias probadas para atraer nuevos clientes y fidelizarlos.",
      author: "Elena García",
      date: "2026-05-28",
      category: "Restaurantes",
      readTime: "7 min",
      featured: true,
      slug: "atraer-retener-clientes-restaurantes",
    },
    {
      id: 3,
      title: "Guía completa de atención al cliente en negocios",
      excerpt:
        "La atención al cliente es la clave del éxito. Conoce las mejores prácticas para ofrecer un servicio de calidad.",
      author: "Miguel Torres",
      date: "2026-05-25",
      category: "Servicio al Cliente",
      readTime: "6 min",
      featured: true,
      slug: "atencion-cliente-negocios",
    },
    {
      id: 4,
      title: "Redes sociales: estrategia de contenido para 2026",
      excerpt:
        "Descubre cómo crear una estrategia de contenido efectiva para redes sociales que aumente tu engagement y conversiones.",
      author: "Sofia Ramírez",
      date: "2026-05-20",
      category: "Marketing Digital",
      readTime: "8 min",
      featured: false,
      slug: "redes-sociales-estrategia-2026",
    },
    {
      id: 5,
      title: "Presupuesto marketing para pequeños negocios",
      excerpt:
        "No necesitas un presupuesto gigante para hacer marketing. Aprende a maximizar tu inversión con presupuesto limitado.",
      author: "Javier López",
      date: "2026-05-15",
      category: "Marketing",
      readTime: "6 min",
      featured: false,
      slug: "presupuesto-marketing-pequenos-negocios",
    },
    {
      id: 6,
      title: "Tendencias de diseño para sitios web en 2026",
      excerpt:
        "El diseño web evoluciona constantemente. Conoce las tendencias más importantes para mantener tu sitio moderno y atractivo.",
      author: "Ana Martínez",
      date: "2026-05-10",
      category: "Diseño",
      readTime: "5 min",
      featured: false,
      slug: "tendencias-diseno-web-2026",
    },
  ]

  const featuredArticles = articles.filter((a) => a.featured)
  const regularArticles = articles.filter((a) => !a.featured)

  const categories = ["Marketing Digital", "Restaurantes", "Servicio al Cliente", "Marketing", "Diseño"]

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-purple-600 to-purple-800 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Blog de Guía ZMG</h1>
              <p className="mt-4 text-xl text-purple-100">
                Consejos, tendencias y estrategias para el éxito de tu negocio
              </p>
            </div>
          </div>
        </section>

        {/* Featured Articles */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Artículos Destacados</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredArticles.map((article) => (
              <Card key={article.id} className="overflow-hidden transition-all hover:shadow-lg">
                <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-50" />
                <CardHeader>
                  <Badge className="w-fit bg-purple-600">{article.category}</Badge>
                  <CardTitle className="mt-2 text-xl">{article.title}</CardTitle>
                  <CardDescription>{article.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {article.author}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(article.date).toLocaleDateString("es-MX")}
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`/blog/${article.slug}`}>
                        Leer artículo
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Filter and All Articles */}
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <h2 className="text-3xl font-bold tracking-tight">Todos los Artículos</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Todos</Badge>
                {categories.map((cat) => (
                  <Badge key={cat} variant="outline">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {regularArticles.map((article) => (
                <Card key={article.id} className="overflow-hidden">
                  <div className="grid gap-6 md:grid-cols-4">
                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-50 md:aspect-auto" />
                    <div className="col-span-3 p-6">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-purple-600">{article.category}</Badge>
                        <span className="text-sm text-gray-500">{article.readTime} de lectura</span>
                      </div>
                      <h3 className="mt-3 text-xl font-bold">{article.title}</h3>
                      <p className="mt-2 text-gray-600">{article.excerpt}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {article.author}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(article.date).toLocaleDateString("es-MX")}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Leer más <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-8 text-center">
            <h2 className="text-2xl font-bold">No te pierdas nuestros artículos</h2>
            <p className="mt-2 text-gray-600">
              Suscríbete a nuestro boletín para recibir los mejores consejos para tu negocio
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <input
                type="email"
                placeholder="tu@correo.com"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              />
              <Button>Suscribirse</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
