import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getZoneSeoStats, getInternalSearchDemand } from "@/lib/seo/opportunities"
import { getTopSearchKeywords } from "@/lib/seo/search-console"
import { MIN_INDEXABLE_PROFILES } from "@/lib/seo/local"

export const dynamic = "force-dynamic"

function StatCard({ label, value, tone = "slate" }: { label: string; value: number; tone?: string }) {
  const color =
    tone === "green" ? "text-green-600" : tone === "amber" ? "text-amber-600" : tone === "blue" ? "text-blue-600" : "text-slate-950"
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
      </CardContent>
    </Card>
  )
}

export default async function AdminSeoOportunidadesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const [zones, demand, gscKeywords] = await Promise.all([
    getZoneSeoStats(),
    getInternalSearchDemand(30, 15),
    getTopSearchKeywords(28, 20),
  ])

  const eligible = zones.filter((z) => z.eligible)
  // Oportunidades de captación: zonas activas SIN suficientes negocios (huecos que
  // conviene llenar reclutando negocios), priorizadas por importancia de la zona.
  const captacion = zones
    .filter((z) => z.isActive && z.profiles < MIN_INDEXABLE_PROFILES)
    .sort((a, b) => b.priority - a.priority || a.profiles - b.profiles)
  const coloniasLinked = zones.reduce((n, z) => n + z.colonias, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">SEO local — oportunidades</h1>
        <p className="mt-1 text-sm text-slate-500">
          Estado de indexación por zona y dónde conviene reclutar negocios. Una landing se indexa en Google cuando la
          zona está activa, marcada como indexable y tiene al menos {MIN_INDEXABLE_PROFILES} perfiles activos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Zonas totales" value={zones.length} />
        <StatCard label="Indexables en Google" value={eligible.length} tone="green" />
        <StatCard label="Oportunidades de captación" value={captacion.length} tone="amber" />
        <StatCard label="Colonias enlazadas" value={coloniasLinked} tone="blue" />
      </div>

      {/* Oportunidades de captación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Oportunidades de captación de negocios ({captacion.length})</CardTitle>
          <p className="text-sm text-slate-500">
            Zonas activas con menos de {MIN_INDEXABLE_PROFILES} negocios. Reclutar aquí desbloquea la landing en Google.
          </p>
        </CardHeader>
        <CardContent>
          {captacion.length === 0 ? (
            <p className="text-sm text-slate-500">Todas las zonas activas ya superan el umbral. 🎉</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-900">
                    <th className="px-3 py-2 font-semibold">Zona</th>
                    <th className="px-3 py-2 font-semibold">Municipio</th>
                    <th className="px-3 py-2 font-semibold">Perfiles</th>
                    <th className="px-3 py-2 font-semibold">Colonias</th>
                    <th className="px-3 py-2 font-semibold">Prioridad</th>
                    <th className="px-3 py-2 font-semibold">Landing</th>
                  </tr>
                </thead>
                <tbody>
                  {captacion.map((z) => (
                    <tr key={z.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-900">{z.name}</td>
                      <td className="px-3 py-2 text-slate-600">{z.municipioName}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                          {z.profiles}/{MIN_INDEXABLE_PROFILES}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{z.colonias}</td>
                      <td className="px-3 py-2 text-slate-600">{z.priority}</td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/${z.municipioSlug}/${z.slug}`}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          /{z.municipioSlug}/{z.slug}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estado de todas las zonas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado de indexación por zona ({zones.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-900">
                  <th className="px-3 py-2 font-semibold">Zona</th>
                  <th className="px-3 py-2 font-semibold">Municipio</th>
                  <th className="px-3 py-2 font-semibold">Perfiles</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">{z.name}</td>
                    <td className="px-3 py-2 text-slate-600">{z.municipioName}</td>
                    <td className="px-3 py-2 text-slate-600">{z.profiles}</td>
                    <td className="px-3 py-2">
                      {!z.isActive ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">Inactiva</span>
                      ) : z.eligible ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-700">
                          En Google
                        </span>
                      ) : !z.isSeoIndexable ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">No indexable</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                          Delgada (noindex)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Demanda interna */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Búsquedas internas (30 días)</CardTitle>
            <p className="text-sm text-slate-500">Pocos resultados = oportunidad de contenido o captación.</p>
          </CardHeader>
          <CardContent>
            {demand.length === 0 ? (
              <p className="text-sm text-slate-500">Aún no hay búsquedas registradas en el periodo.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-900">
                      <th className="px-3 py-2 font-semibold">Búsqueda</th>
                      <th className="px-3 py-2 font-semibold">Veces</th>
                      <th className="px-3 py-2 font-semibold">Result. prom.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demand.map((d) => (
                      <tr key={d.query} className="border-b border-slate-100">
                        <td className="px-3 py-2 text-slate-900">{d.query}</td>
                        <td className="px-3 py-2 text-slate-600">{d.searches}</td>
                        <td className="px-3 py-2">
                          <span className={d.avgResults < 3 ? "font-semibold text-amber-600" : "text-slate-600"}>
                            {d.avgResults}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Search Console */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Google Search Console (28 días)</CardTitle>
            <p className="text-sm text-slate-500">Palabras clave reales por las que apareces en Google.</p>
          </CardHeader>
          <CardContent>
            {gscKeywords === null ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No conectado. Agrega la cuenta de servicio y la URL en{" "}
                <Link href="/admin/configuracion/seo" className="text-blue-600 hover:underline">
                  Config → SEO
                </Link>{" "}
                (campos <code>gsc_service_account</code> y <code>gsc_site_url</code>).
              </div>
            ) : gscKeywords.length === 0 ? (
              <p className="text-sm text-slate-500">Conectado, pero sin datos en el periodo.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-900">
                      <th className="px-3 py-2 font-semibold">Keyword</th>
                      <th className="px-3 py-2 font-semibold">Clics</th>
                      <th className="px-3 py-2 font-semibold">Impr.</th>
                      <th className="px-3 py-2 font-semibold">Pos.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gscKeywords.map((k) => (
                      <tr key={k.keyword} className="border-b border-slate-100">
                        <td className="px-3 py-2 text-slate-900">{k.keyword}</td>
                        <td className="px-3 py-2 text-slate-600">{k.clicks}</td>
                        <td className="px-3 py-2 text-slate-600">{k.impressions}</td>
                        <td className="px-3 py-2 text-slate-600">{k.position.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
