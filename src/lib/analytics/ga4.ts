import { getSetting } from "@/lib/settings"
import { getGoogleAccessToken } from "@/lib/google/service-account"

// Integración con Google Analytics 4 (Data API). Credential-ready: reutiliza la
// MISMA cuenta de servicio de Search Console (gsc_service_account) y lee el ID
// numérico de la propiedad de `ga4_property_id`. Sin credencial/ID → null, y el
// panel muestra el aviso para conectarlo. Requiere que la cuenta de servicio tenga
// acceso de lectura a la propiedad GA4 y la "Analytics Data API" habilitada.

export interface Ga4Breakdown {
  label: string
  users: number
  pct: number // 0..100 dentro de su categoría
}

export interface Ga4Summary {
  days: number
  totals: {
    activeUsers: number
    sessions: number
    pageViews: number
    engagementRate: number // 0..1
    avgSessionSec: number
  }
  usersTrendPct: number | null // usuarios vs periodo anterior
  countries: Ga4Breakdown[]
  devices: Ga4Breakdown[]
  os: Ga4Breakdown[]
  browsers: Ga4Breakdown[]
}

type GaRow = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }
type GaReport = { rows?: GaRow[] }

// Convierte un reporte (1 dimensión + activeUsers) en barras con % dentro de su
// categoría (para el look tipo Vercel: país/dispositivo/SO/navegador).
function toBreakdown(report: GaReport | undefined, limit = 6): Ga4Breakdown[] {
  const rows = report?.rows ?? []
  const items = rows.map((r) => ({
    label: r.dimensionValues?.[0]?.value ?? "(desconocido)",
    users: Number(r.metricValues?.[0]?.value ?? 0),
  }))
  const total = items.reduce((s, i) => s + i.users, 0) || 1
  return items
    .slice(0, limit)
    .map((i) => ({ ...i, pct: Math.round((i.users / total) * 100) }))
}

export async function getGa4Summary(days = 28): Promise<Ga4Summary | null> {
  const raw = await getSetting("gsc_service_account", "GSC_SERVICE_ACCOUNT")
  const propertyId = (await getSetting("ga4_property_id", "GA4_PROPERTY_ID"))
    .trim()
    .replace(/^properties\//, "")
  if (!raw || !propertyId) return null

  let creds: { client_email?: string; private_key?: string }
  try {
    creds = JSON.parse(raw)
  } catch {
    return null
  }
  if (!creds.client_email || !creds.private_key) return null

  const token = await getGoogleAccessToken(
    "https://www.googleapis.com/auth/analytics.readonly",
    creds.client_email,
    creds.private_key.replace(/\\n/g, "\n"),
  )
  if (!token) return null

  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:batchRunReports`
  const current = [{ startDate: `${days}daysAgo`, endDate: "today" }]
  const previous = [{ startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` }]
  const usersMetric = [{ name: "activeUsers" }]
  const breakdown = (dimension: string) => ({
    dateRanges: current,
    dimensions: [{ name: dimension }],
    metrics: usersMetric,
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit: 8,
  })

  async function batch(requests: unknown[]): Promise<GaReport[] | null> {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ requests }),
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) return null
      const j = (await res.json()) as { reports?: GaReport[] }
      return j.reports ?? []
    } catch {
      return null
    }
  }

  // Batch A (5 reportes): totales actuales, usuarios del periodo anterior, país,
  // dispositivo y SO. Batch B (1): navegador. (Límite de 5 reportes por batch.)
  const [batchA, batchB] = await Promise.all([
    batch([
      {
        dateRanges: current,
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "engagementRate" },
          { name: "averageSessionDuration" },
        ],
      },
      { dateRanges: previous, metrics: usersMetric },
      breakdown("country"),
      breakdown("deviceCategory"),
      breakdown("operatingSystem"),
    ]),
    batch([breakdown("browser")]),
  ])
  if (!batchA) return null

  const t = batchA[0]?.rows?.[0]?.metricValues ?? []
  const num = (i: number) => Number(t[i]?.value ?? 0)
  const curUsers = Math.round(num(0))
  const prevUsers = Math.round(Number(batchA[1]?.rows?.[0]?.metricValues?.[0]?.value ?? 0))

  return {
    days,
    totals: {
      activeUsers: curUsers,
      sessions: Math.round(num(1)),
      pageViews: Math.round(num(2)),
      engagementRate: num(3),
      avgSessionSec: num(4),
    },
    usersTrendPct: prevUsers > 0 ? Math.round(((curUsers - prevUsers) / prevUsers) * 100) : null,
    countries: toBreakdown(batchA[2]),
    devices: toBreakdown(batchA[3]),
    os: toBreakdown(batchA[4]),
    browsers: toBreakdown(batchB?.[0]),
  }
}

export interface Ga4Realtime {
  activeUsers: number // usuarios en los últimos 30 min
  topPages: { label: string; users: number }[]
}

// Reporte en tiempo real de GA4 (usuarios activos en los últimos 30 min). Mismo
// patrón de credencial/propiedad que getGa4Summary; null si no está conectado.
export async function getGa4Realtime(): Promise<Ga4Realtime | null> {
  const raw = await getSetting("gsc_service_account", "GSC_SERVICE_ACCOUNT")
  const propertyId = (await getSetting("ga4_property_id", "GA4_PROPERTY_ID"))
    .trim()
    .replace(/^properties\//, "")
  if (!raw || !propertyId) return null

  let creds: { client_email?: string; private_key?: string }
  try {
    creds = JSON.parse(raw)
  } catch {
    return null
  }
  if (!creds.client_email || !creds.private_key) return null

  const token = await getGoogleAccessToken(
    "https://www.googleapis.com/auth/analytics.readonly",
    creds.client_email,
    creds.private_key.replace(/\\n/g, "\n"),
  )
  if (!token) return null

  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runRealtimeReport`
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        dimensions: [{ name: "unifiedScreenName" }],
        metrics: [{ name: "activeUsers" }],
        metricAggregations: ["TOTAL"],
        limit: 5,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const j = (await res.json()) as { rows?: GaRow[]; totals?: GaRow[] }
    const rows = j.rows ?? []
    const topPages = rows.map((r) => ({
      label: r.dimensionValues?.[0]?.value ?? "(desconocido)",
      users: Number(r.metricValues?.[0]?.value ?? 0),
    }))
    const totalVal = j.totals?.[0]?.metricValues?.[0]?.value
    const activeUsers =
      totalVal != null ? Number(totalVal) : topPages.reduce((s, p) => s + p.users, 0)
    return { activeUsers, topPages }
  } catch {
    return null
  }
}
