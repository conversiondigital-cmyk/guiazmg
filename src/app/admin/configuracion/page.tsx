import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ADMIN_CONFIG_SECTIONS } from "@/lib/admin-config-fields"

export const dynamic = "force-dynamic"

// Se deriva de ADMIN_CONFIG_SECTIONS para que cualquier sección nueva aparezca
// automáticamente aquí (antes era una lista hardcodeada que quedaba desfasada).
const sections = Object.entries(ADMIN_CONFIG_SECTIONS).map(([slug, cfg]) => ({
  slug,
  label: cfg.title,
  desc: cfg.description,
}))

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
