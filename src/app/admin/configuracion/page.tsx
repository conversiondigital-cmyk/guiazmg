import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ADMIN_CONFIG_SECTIONS } from "@/lib/admin-config-fields"

export const dynamic = "force-dynamic"

// Todas las secciones se derivan de ADMIN_CONFIG_SECTIONS (fuente única). Aquí solo
// las AGRUPAMOS por tema para que sean fáciles de encontrar. NADA se oculta: lo que
// no esté asignado a un grupo cae en "Otros" automáticamente.
const GROUPS: { title: string; slugs: string[] }[] = [
  { title: "General", slugs: ["general", "branding", "contacto", "legal"] },
  { title: "Pagos y planes", slugs: ["pagos", "membresias", "boosts"] },
  { title: "Integraciones", slugs: ["mapas", "correo", "sms", "storage", "auth", "eventos"] },
  { title: "Contenido y SEO", slugs: ["seo", "landing", "marketplace", "onboarding", "moderacion"] },
  { title: "Seguridad y sistema", slugs: ["seguridad", "flags"] },
]

export default function AdminConfigHubPage() {
  const all = ADMIN_CONFIG_SECTIONS as Record<string, { title: string; description: string }>
  const grouped = new Set(GROUPS.flatMap((g) => g.slugs))
  // Respaldo: cualquier sección existente que no esté en un grupo se muestra igual.
  const leftover = Object.keys(all).filter((slug) => !grouped.has(slug))
  const groups = [
    ...GROUPS.map((g) => ({ title: g.title, slugs: g.slugs.filter((s) => all[s]) })),
    ...(leftover.length ? [{ title: "Otros", slugs: leftover }] : []),
  ].filter((g) => g.slugs.length > 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Configuración global</h1>
        <p className="text-sm text-slate-500">Centro de control del sistema. Solo ADMIN.</p>
      </div>

      {groups.map((group) => (
        <section key={group.title} className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">{group.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.slugs.map((slug) => {
              const cfg = all[slug]
              return (
                <Link key={slug} href={`/admin/configuracion/${slug}`}>
                  <Card className="h-full transition-colors hover:border-slate-300 hover:bg-slate-50">
                    <CardHeader>
                      <CardTitle className="text-base">{cfg.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600">{cfg.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
