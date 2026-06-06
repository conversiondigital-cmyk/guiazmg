import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export const dynamic = "force-dynamic"

const SECTION_META: Record<string, { title: string; description: string }> = {
  general: { title: "General", description: "Nombre del sistema, dominio, soporte y mantenimiento." },
  branding: { title: "Branding", description: "Logo, favicon, colores y recursos visuales." },
  auth: { title: "Autenticación", description: "Registro, OAuth, sesión y password rules." },
  correo: { title: "Correo SMTP", description: "Host, puerto, usuario, password y pruebas." },
  sms: { title: "SMS", description: "Proveedor, token y plantillas base." },
  pagos: { title: "Pagos", description: "Mercado Pago y Stripe." },
  membresias: { title: "Membresías", description: "Planes, límites y precios." },
  boosts: { title: "Boosts", description: "Tipos, duración, precios y targets." },
  seo: { title: "SEO", description: "Metadatos globales, robots y sitemap." },
  seguridad: { title: "Seguridad", description: "CSP, CORS, cookies y sesiones." },
  storage: { title: "Storage", description: "Bucket, región, límites y tipos permitidos." },
  moderacion: { title: "Moderación", description: "Reglas de publicación y spam." },
  legal: { title: "Legal", description: "Términos, privacidad, cookies y aviso legal." },
  flags: { title: "Feature Flags", description: "Switches globales del sistema." },
}

export default async function AdminConfigSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const meta = SECTION_META[section]
  if (!meta) notFound()

  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") notFound()

  const generalSettings =
    section === "general"
      ? await prisma.systemSetting.findMany({
          where: { key: { in: ["site_name", "site_logo_url", "site_favicon_url", "support_email", "support_phone"] } },
          orderBy: { key: "asc" },
        })
      : []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin / Configuración / {meta.title}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">{meta.title}</h1>
        <p className="text-sm text-slate-500">{meta.description}</p>
      </div>

      {section === "general" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuración General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {generalSettings.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {generalSettings.map((s) => (
                  <div key={s.key} className="rounded-xl border p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{s.key}</p>
                    <p className="mt-1 text-sm text-slate-900">{s.value || "—"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-600">No hay configuraciones generales almacenadas aún.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Secciones implementadas por tipo */}
      {section === "branding" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium text-slate-900">Logo principal</label>
              <p className="mt-1 text-sm text-slate-600">URL del logo principal de Guía ZMG</p>
            </div>
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium text-slate-900">Favicon</label>
              <p className="mt-1 text-sm text-slate-600">Favicon para las pestañas del navegador</p>
            </div>
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium text-slate-900">Color primario</label>
              <p className="mt-1 text-sm text-slate-600">Color principal de la plataforma (hex: #22c55e)</p>
            </div>
            <p className="text-xs text-slate-500 border-t pt-4">Los cambios de branding se reflejan en todo el sistema automáticamente.</p>
          </CardContent>
        </Card>
      )}

      {section === "auth" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuración de Autenticación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium text-slate-900">Registro habilitado</label>
              <p className="mt-1 text-sm text-slate-600">✅ Usuarios nuevos pueden registrarse</p>
            </div>
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium text-slate-900">OAuth Google</label>
              <p className="mt-1 text-sm text-slate-600">✅ Habilitado - AUTH_GOOGLE_ID configurado</p>
            </div>
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium text-slate-900">Duración de sesión</label>
              <p className="mt-1 text-sm text-slate-600">30 días (JWT)</p>
            </div>
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium text-slate-900">Requisitos de password</label>
              <p className="mt-1 text-sm text-slate-600">Mínimo 8 caracteres, sin validación de complejidad actualmente</p>
            </div>
          </CardContent>
        </Card>
      )}

      {section === "pagos" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuración de Pagos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium text-slate-900">Mercado Pago</label>
              <p className="mt-1 text-sm text-slate-600">✅ Habilitado - Access Token configurado</p>
            </div>
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium text-slate-900">Stripe</label>
              <p className="mt-1 text-sm text-slate-600">⏳ Deshabilitado - Configurar en próxima versión</p>
            </div>
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium text-slate-900">Webhook URL</label>
              <p className="mt-1 text-sm text-slate-600">https://api.guia-zmg.local/webhooks/payment</p>
            </div>
          </CardContent>
        </Card>
      )}

      {section === "membresias" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Planes de Membresía</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
              <p className="font-medium text-green-900">Gratuito</p>
              <p className="text-sm text-green-700">$0/mes - 10 anuncios máximo</p>
            </div>
            <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
              <p className="font-medium text-blue-900">Emprendedor</p>
              <p className="text-sm text-blue-700">$49/mes - 100 anuncios máximo</p>
            </div>
            <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50 p-4">
              <p className="font-medium text-purple-900">Negocio</p>
              <p className="text-sm text-purple-700">$149/mes - 100 anuncios + badges destacados</p>
            </div>
            <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4">
              <p className="font-medium text-yellow-900">Premium</p>
              <p className="text-sm text-yellow-700">$299/mes - 200 anuncios + máxima visibilidad</p>
            </div>
          </CardContent>
        </Card>
      )}

      {section === "boosts" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuración de Boosts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border p-4">
              <p className="font-medium text-slate-900">7 días - $49</p>
              <p className="text-sm text-slate-600">Boost de 7 días, prioridad +2</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium text-slate-900">15 días - $99</p>
              <p className="text-sm text-slate-600">Boost de 15 días, prioridad +3</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium text-slate-900">30 días - $149</p>
              <p className="text-sm text-slate-600">Boost de 30 días, prioridad +5</p>
            </div>
          </CardContent>
        </Card>
      )}

      {section === "seo" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuración SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium text-slate-900">Meta tags globales</label>
              <p className="mt-1 text-sm text-slate-600">Configurados automáticamente según página</p>
            </div>
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium text-slate-900">Sitemap.xml</label>
              <p className="mt-1 text-sm text-slate-600">✅ Generado automáticamente</p>
            </div>
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium text-slate-900">Robots.txt</label>
              <p className="mt-1 text-sm text-slate-600">✅ Configurado para permitir crawling</p>
            </div>
          </CardContent>
        </Card>
      )}

      {section !== "general" && section !== "branding" && section !== "auth" && section !== "pagos" && section !== "membresias" && section !== "boosts" && section !== "seo" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{meta.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Sección en desarrollo. Próximamente habrá configuración interactiva para esta sección.</p>
            <Link href="/admin/configuracion" className="inline-flex rounded-lg border px-3 py-2 text-slate-700 hover:bg-slate-50">
              Volver al hub
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
