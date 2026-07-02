import crypto from "crypto"
import { getSetting } from "@/lib/settings"

// Integración con Google Search Console (palabras clave reales de Google).
// Credential-ready: lee la cuenta de servicio (JSON) y la URL de la propiedad de
// SystemSetting (Admin → Config → SEO) o de env. Sin credencial, devuelve null y
// el panel muestra el aviso para conectarlo.

export interface GscQueryRow {
  keyword: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

// Firma un JWT de cuenta de servicio (RS256) y lo intercambia por un access token.
async function getAccessToken(clientEmail: string, privateKey: string): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000)
    const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    const claim = base64url(
      JSON.stringify({
        iss: clientEmail,
        scope: "https://www.googleapis.com/auth/webmasters.readonly",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      })
    )
    const signingInput = `${header}.${claim}`
    const signer = crypto.createSign("RSA-SHA256")
    signer.update(signingInput)
    const signature = base64url(signer.sign(privateKey))
    const assertion = `${signingInput}.${signature}`

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const j = await res.json()
    return j.access_token ?? null
  } catch {
    return null
  }
}

// Devuelve las palabras clave top de Google en los últimos `days` días, o null si
// no está configurado / hay error.
export async function getTopSearchKeywords(days = 28, limit = 25): Promise<GscQueryRow[] | null> {
  const raw = await getSetting("gsc_service_account", "GSC_SERVICE_ACCOUNT")
  if (!raw) return null

  let creds: { client_email?: string; private_key?: string }
  try {
    creds = JSON.parse(raw)
  } catch {
    return null
  }
  if (!creds.client_email || !creds.private_key) return null

  const siteUrl = (await getSetting("gsc_site_url", "GSC_SITE_URL")) || "https://guiazmg.vercel.app/"
  const token = await getAccessToken(creds.client_email, creds.private_key.replace(/\\n/g, "\n"))
  if (!token) return null

  try {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)

    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          startDate: fmt(start),
          endDate: fmt(end),
          dimensions: ["query"],
          rowLimit: limit,
        }),
        signal: AbortSignal.timeout(6000),
      }
    )
    if (!res.ok) return null
    const j = await res.json()
    return (j.rows ?? []).map((r: { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }) => ({
      keyword: r.keys?.[0] ?? "",
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    }))
  } catch {
    return null
  }
}
