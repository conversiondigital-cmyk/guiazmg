import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, Search, MessageSquare } from "lucide-react"

export const metadata: Metadata = {
  title: "Ayuda | Guía ZMG",
  description: "Centro de ayuda y soporte para Guía ZMG. Resuelve tus dudas aquí.",
}

export default function AyudaPage() {
  const categories = [
    {
      title: "Búsqueda y Navegación",
      icon: "🔍",
      articles: [
        "Cómo usar la búsqueda",
        "Filtrar resultados de búsqueda",
        "Navegación del sitio",
        "Acceso a categorías",
      ],
    },
    {
      title: "Registrar un Negocio",
      icon: "🏪",
      articles: [
        "Crear cuenta de negocio",
        "Completar información del perfil",
        "Subir fotos y videos",
        "Añadir horarios y ubicación",
      ],
    },
    {
      title: "Gestionar mi Negocio",
      icon: "📊",
      articles: [
        "Panel de control",
        "Editar información",
        "Ver estadísticas",
        "Administrar promociones",
      ],
    },
    {
      title: "Planes y Suscripciones",
      icon: "💳",
      articles: [
        "Tipos de planes disponibles",
        "Diferencias entre planes",
        "Cambiar o cancelar suscripción",
        "Métodos de pago",
      ],
    },
    {
      title: "Reseñas y Calificaciones",
      icon: "⭐",
      articles: [
        "Cómo dejar una reseña",
        "Sistema de calificaciones",
        "Responder a reseñas",
        "Reportar contenido inapropiado",
      ],
    },
    {
      title: "Privacidad y Seguridad",
      icon: "🔒",
      articles: [
        "Protección de datos",
        "Cambiar contraseña",
        "Recuperar cuenta",
        "Eliminar datos personales",
      ],
    },
  ]

  const faqs = [
    {
      id: 1,
      category: "Búsqueda y Navegación",
      question: "¿Cómo realizo una búsqueda en Guía ZMG?",
      answer:
        "Utiliza la barra de búsqueda en la parte superior del sitio. Puedes buscar por nombre de negocio, categoría o ubicación. También puedes usar los filtros para refinar tu búsqueda.",
    },
    {
      id: 2,
      category: "Registrar un Negocio",
      question: "¿Es gratis registrar mi negocio?",
      answer:
        "Sí, el registro es completamente gratuito. Puedes crear un perfil básico sin costo. Contamos con planes premium opcionales que ofrecen características adicionales.",
    },
    {
      id: 3,
      category: "Registrar un Negocio",
      question: "¿Qué información debo proporcionar para registrar mi negocio?",
      answer:
        "Necesitarás: nombre del negocio, categoría, descripción, ubicación, teléfono, correo electrónico y fotos. Puedes agregar más información como horarios, redes sociales y promociones.",
    },
    {
      id: 4,
      category: "Gestionar mi Negocio",
      question: "¿Cómo edito la información de mi negocio?",
      answer:
        "Accede a tu panel de control con tu usuario y contraseña. En la sección 'Mi Negocio' encontrarás opciones para editar todos los datos de tu perfil.",
    },
    {
      id: 5,
      category: "Reseñas y Calificaciones",
      question: "¿Cómo puedo responder a una reseña?",
      answer:
        "En tu panel de control, ve a la sección de reseñas. Encontrarás la opción para responder a cada comentario de cliente. Esto ayuda a mejorar tu relación con los clientes.",
    },
    {
      id: 6,
      category: "Privacidad y Seguridad",
      question: "¿Cómo cambio mi contraseña?",
      answer:
        "En tu panel de control, ve a Configuración > Seguridad. Ahí encontrarás la opción para cambiar tu contraseña. Te recomendamos usar contraseñas fuertes y cambiarlas regularmente.",
    },
    {
      id: 7,
      category: "Planes y Suscripciones",
      question: "¿Puedo cambiar mi plan en cualquier momento?",
      answer:
        "Sí, puedes cambiar tu plan en cualquier momento desde tu panel de control. Los cambios se aplicarán en el próximo período de facturación.",
    },
    {
      id: 8,
      category: "Privacidad y Seguridad",
      question: "¿Cómo elimino mi cuenta y datos personales?",
      answer:
        "Puedes solicitar la eliminación de tu cuenta desde tu panel en Configuración > Eliminar Cuenta. Procesamos estas solicitudes dentro de 30 días hábiles, conforme a la ley.",
    },
  ]

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-green-900 py-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{backgroundImage:"radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",backgroundSize:"60px 60px"}} />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">Soporte</p>
              <h1 className="text-4xl font-black text-white sm:text-5xl">Centro de Ayuda</h1>
              <p className="mt-4 text-xl text-green-200">
                Encuentra respuestas a tus preguntas y resuelve problemas
              </p>

              {/* Search Box */}
              <div className="mt-8 flex justify-center">
                <div className="relative w-full max-w-md">
                  <input
                    type="text"
                    placeholder="Busca en la ayuda..."
                    className="w-full rounded-lg bg-white px-4 py-3 pl-10 text-sm text-gray-900 shadow-lg placeholder-gray-500"
                  />
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold">Temas de Ayuda</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.title} className="transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-3xl">{category.icon}</span>
                    <span className="text-lg">{category.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.articles.map((article) => (
                      <li key={article}>
                        <a href="#" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                          {article}
                          <ChevronRight className="h-4 w-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-3xl font-bold">Preguntas Frecuentes</h2>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <Card key={faq.id} className="cursor-pointer transition-all hover:shadow-md">
                  <details className="group">
                    <summary className="flex items-center justify-between p-6 font-semibold text-gray-900 hover:text-blue-600">
                      <div className="text-left">
                        <div className="text-xs font-medium text-gray-500 mb-1">{faq.category}</div>
                        <div>{faq.question}</div>
                      </div>
                      <ChevronRight className="h-5 w-5 transform transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="border-t border-gray-200 px-6 py-4">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  </details>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900">¿No encontraste lo que buscabas?</h2>
            <p className="mt-2 text-gray-700">Nuestro equipo de soporte está aquí para ayudarte</p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="default">
                <MessageSquare className="mr-2 h-5 w-5" />
                Contactar Soporte
              </Button>
              <Button size="lg" variant="outline">
                Ver Estado del Sistema
              </Button>
            </div>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-center text-3xl font-bold">Maneras de Contactarnos</h2>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Chat en Vivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Habla con un agente de soporte en tiempo real. Disponible de lunes a viernes, 9am-6pm.
                  </p>
                  <Button className="mt-4 w-full" variant="outline">
                    Abrir Chat
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">📧</span>
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Envía tu pregunta a support@guiazmg.com. Responderemos dentro de 24 horas.
                  </p>
                  <Button className="mt-4 w-full" variant="outline">
                    Enviar Email
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">📞</span>
                    Teléfono
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Llámanos al (33) 0000-0000. Estamos disponibles de lunes a viernes.
                  </p>
                  <Button className="mt-4 w-full" variant="outline">
                    Ver Horarios
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
