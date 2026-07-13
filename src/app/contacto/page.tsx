"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, MapPin, Phone, Clock } from "lucide-react"
import { useState } from "react"

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    asunto: "",
    mensaje: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica para enviar el formulario
    console.log("Formulario enviado:", formData)
    setSubmitted(true)
    setTimeout(() => {
      setFormData({ nombre: "", email: "", telefono: "", asunto: "", mensaje: "" })
      setSubmitted(false)
    }, 3000)
  }

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
              <h1 className="text-4xl font-black text-white sm:text-5xl">Contacto</h1>
              <p className="mt-4 text-xl text-green-200">
                ¿Preguntas o sugerencias? Nos encantaría escucharte
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <Mail className="h-8 w-8 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">Email</h3>
                <p className="mt-2 text-sm text-gray-600">contacto@guiazmg.com</p>
                <p className="text-xs text-gray-500">Respuesta en 24 horas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <Phone className="h-8 w-8 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">Teléfono</h3>
                <p className="mt-2 text-sm text-gray-600">(33) 4884-3477</p>
                <p className="text-xs text-gray-500">Lunes a Viernes 9am-6pm</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <MapPin className="h-8 w-8 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">Ubicación</h3>
                <p className="mt-2 text-sm text-gray-600">Guadalajara, Jalisco</p>
                <p className="text-xs text-gray-500">Zona Metropolitana</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <Clock className="h-8 w-8 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">Horarios</h3>
                <p className="mt-2 text-sm text-gray-600">Lunes a Viernes</p>
                <p className="text-xs text-gray-500">9:00 AM - 6:00 PM</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Form */}
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-lg bg-white p-8 shadow-md">
              <h2 className="text-2xl font-bold">Envíanos un mensaje</h2>
              <p className="mt-2 text-gray-600">Completa el formulario y nos pondremos en contacto pronto.</p>

              {submitted ? (
                <div className="mt-8 rounded-lg bg-green-50 p-4 text-green-800">
                  <p className="font-semibold">¡Mensaje enviado correctamente!</p>
                  <p className="text-sm">Nos pondremos en contacto dentro de 24 horas.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                      <Input
                        type="text"
                        name="nombre"
                        placeholder="Tu nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email *</label>
                      <Input
                        type="email"
                        name="email"
                        placeholder="tu@correo.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                      <Input
                        type="tel"
                        name="telefono"
                        placeholder="(33) 0000-0000"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Asunto *</label>
                      <select
                        name="asunto"
                        value={formData.asunto}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">Selecciona un asunto</option>
                        <option value="soporte">Soporte Técnico</option>
                        <option value="negocios">Registrar Negocio</option>
                        <option value="publicidad">Publicidad</option>
                        <option value="general">Consulta General</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mensaje *</label>
                    <textarea
                      name="mensaje"
                      placeholder="Cuéntanos qué necesitas..."
                      value={formData.mensaje}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <input type="checkbox" required className="rounded" />
                    <span>
                      Acepto la{" "}
                      <a href="/politica-privacidad" className="text-emerald-600 hover:underline">
                        política de privacidad
                      </a>
                    </span>
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Enviar Mensaje
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Preguntas Frecuentes</h2>
          <p className="mt-2 text-gray-600">Encuentra respuestas a las preguntas más comunes</p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              {
                q: "¿Cuánto cuesta registrar un negocio?",
                a: "El registro es gratuito. Puedes crear un perfil básico sin costo y acceder a planes premium según tus necesidades.",
              },
              {
                q: "¿Cómo puedo editar la información de mi negocio?",
                a: "Accede a tu panel de control con tu usuario y contraseña. Desde allí puedes actualizar fotos, horarios, descripción y más.",
              },
              {
                q: "¿Cómo contacto con un negocio?",
                a: "Puedes encontrar información de contacto en el perfil del negocio. Algunos ofrecen chat directo desde la plataforma.",
              },
              {
                q: "¿Es segura mi información personal?",
                a: "Sí. Utilizamos encriptación de datos y cumplimos con la Ley Federal de Protección de Datos Personales. Ver nuestra política de privacidad.",
              },
            ].map((faq, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-base">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
