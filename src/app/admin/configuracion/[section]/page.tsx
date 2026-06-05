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
            <CardTitle className="text-base">Valores generales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {generalSettings.map((s) => (
              <div key={s.key} className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{s.key}</p>
                <p className="mt-1 text-sm text-slate-900">{s.value || "—"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{meta.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Esta sección existe como módulo independiente del panel global.</p>
            <p>Si necesitas persistencia directa en base de datos, esta sección debe conectar con settings específicos o variables de entorno administradas en despliegue.</p>
            <Link href="/admin/configuracion" className="inline-flex rounded-lg border px-3 py-2 text-slate-700 hover:bg-slate-50">
              Volver al hub
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
