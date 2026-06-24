import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

const sections = [
  { slug: "general", label: "General", desc: "Nombre, dominio, soporte, zona horaria y modo mantenimiento" },
  { slug: "mapas", label: "Google Maps", desc: "API key y selector de ubicación (pin) en el mapa" },
  { slug: "eventos", label: "Eventos (RSS)", desc: "Feeds para importar eventos automáticamente" },
  { slug: "branding", label: "Branding", desc: "Logo, favicon, colores e imagenes por defecto" },
  { slug: "auth", label: "Autenticación", desc: "Registro, OAuth, sesión y reglas de password" },
  { slug: "correo", label: "Correo SMTP", desc: "Servidor, credenciales, TLS y pruebas" },
  { slug: "sms", label: "SMS", desc: "Proveedor y plantillas" },
  { slug: "pagos", label: "Pagos", desc: "Mercado Pago, Stripe, sandbox y webhook" },
  { slug: "membresias", label: "Membresías", desc: "Planes, límites y precios" },
  { slug: "boosts", label: "Boosts", desc: "Duración, precios y targets" },
  { slug: "seo", label: "SEO", desc: "Metadatos, robots, sitemap y schema" },
  { slug: "seguridad", label: "Seguridad", desc: "CSP, CORS, sesiones y rate limiting" },
  { slug: "storage", label: "Storage", desc: "Bucket, región, límites y tipos permitidos" },
  { slug: "moderacion", label: "Moderación", desc: "Auto aprobación, spam y palabras bloqueadas" },
  { slug: "legal", label: "Legal", desc: "Términos, privacidad, cookies y aviso legal" },
  { slug: "flags", label: "Feature Flags", desc: "Módulos globales y beta features" },
]

export default function AdminConfigHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Configuración global</h1>
        <p className="text-sm text-slate-500">Centro de control del sistema. Solo ADMIN.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.slug} href={`/admin/configuracion/${section.slug}`}>
            <Card className="h-full transition-colors hover:border-slate-300 hover:bg-slate-50">
              <CardHeader>
                <CardTitle className="text-base">{section.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{section.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
