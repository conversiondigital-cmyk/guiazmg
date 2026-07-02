// Clasifica el origen de una visita a partir del referrer y los parámetros UTM.
export type TrafficChannel = "DIRECT" | "ORGANIC" | "SOCIAL" | "REFERRAL" | "CAMPAIGN"

const SEARCH_ENGINES = ["google.", "bing.", "yahoo.", "duckduckgo.", "ecosia.", "yandex.", "baidu.", "brave."]
const SOCIAL_SITES = [
  "facebook.", "fb.com", "instagram.", "twitter.", "x.com", "t.co", "tiktok.",
  "linkedin.", "lnkd.in", "youtube.", "youtu.be", "pinterest.", "wa.me", "whatsapp.", "reddit.",
]

export function classifyTraffic(input: {
  referrer?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  selfHost?: string | null
}): { channel: TrafficChannel; source: string | null } {
  const utm = (input.utmSource || input.utmMedium || "").trim().toLowerCase()
  if (utm) return { channel: "CAMPAIGN", source: utm || null }

  let host = ""
  try {
    if (input.referrer) host = new URL(input.referrer).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    host = ""
  }
  if (!host) return { channel: "DIRECT", source: null }

  const self = (input.selfHost || "").toLowerCase().replace(/^www\./, "")
  if (self && host === self) return { channel: "DIRECT", source: null } // navegación interna

  if (SEARCH_ENGINES.some((s) => host.includes(s))) return { channel: "ORGANIC", source: host }
  if (SOCIAL_SITES.some((s) => host.includes(s))) return { channel: "SOCIAL", source: host }
  return { channel: "REFERRAL", source: host }
}

export const CHANNEL_LABELS: Record<TrafficChannel, string> = {
  DIRECT: "Directo",
  ORGANIC: "Buscadores (orgánico)",
  SOCIAL: "Redes sociales",
  REFERRAL: "Referencias",
  CAMPAIGN: "Campañas",
}
