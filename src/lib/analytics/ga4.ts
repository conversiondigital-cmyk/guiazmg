import { getSetting } from "@/lib/settings"
import { getGoogleAccessToken } from "@/lib/google/service-account"

// Integración con Google Analytics 4 (Data API). Credential-ready: reutiliza la
// MISMA cuenta de servicio de Search Console (gsc_service_account) y lee el ID
// numérico de la propiedad de `ga4_property_id`. Sin credencial/ID → null, y el
// panel muestra el aviso para conectarlo. Requiere que la cuenta de servicio tenga
// acceso de lectura a la propiedad GA4 y la "Analytics Data API" habilitada.

export interface Ga4Summary {
  days: number
  totals: {
    activeUsers: number
    sessions: number
    pageViews: number
    engagementRate: number // 0..1
    avgSessionSec: number
  }
  topPages: { path: string; views: number }[]
  channels: { channel: string; sessions: number }[]
}

type GaRow = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }
type GaReport = { rows?: GaRow[] }

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

  try {
    const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "today" }]
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:batchRunReports`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              dateRanges,
              metrics: [
                { name: "activeUsers" },
                { name: "sessions" },
                { name: "screenPageViews" },
                { name: "engagementRate" },
                { name: "averageSessionDuration" },
              ],
            },
            {
              dateRanges,
              dimensions: [{ name: "pagePath" }],
              metrics: [{ name: "screenPageViews" }],
              orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
              limit: 10,
            },
            {
              dateRanges,
              dimensions: [{ name: "sessionDefaultChannelGroup" }],
              metrics: [{ name: "sessions" }],
              orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
              limit: 8,
            },
          ],
        }),
        signal: AbortSignal.timeout(6000),
      },
    )
    if (!res.ok) return null
    const j = (await res.json()) as { reports?: GaReport[] }
    const reports = j.reports ?? []

    const t = reports[0]?.rows?.[0]?.metricValues ?? []
    const num = (i: number) => Number(t[i]?.value ?? 0)

    return {
      days,
      totals: {
        activeUsers: Math.round(num(0)),
        sessions: Math.round(num(1)),
        pageViews: Math.round(num(2)),
        engagementRate: num(3),
        avgSessionSec: num(4),
      },
      topPages: (reports[1]?.rows ?? []).map((r) => ({
        path: r.dimensionValues?.[0]?.value ?? "",
        views: Number(r.metricValues?.[0]?.value ?? 0),
      })),
      channels: (reports[2]?.rows ?? []).map((r) => ({
        channel: r.dimensionValues?.[0]?.value ?? "",
        sessions: Number(r.metricValues?.[0]?.value ?? 0),
      })),
    }
  } catch {
    return null
  }
}
