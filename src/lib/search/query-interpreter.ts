const URGENCY_KEYWORDS = ["urgente", "urgencia", "emergencia", "ahora", "abierto"]
const PROXIMITY_KEYWORDS = ["cerca", "cercano", "alrededor", "cerca de mí", "más cercano", "cerca de mi"]

const EMERGENCY_CATEGORIES = new Set([
  "cerrajero", "cerrajeros", "plomero", "plomeros",
  "electricista", "electricistas", "grúa", "grúas",
  "mecánico", "mecánicos", "vulcanizadora", "vulcanizadoras",
  "ambulancia", "ambulancias", "veterinaria 24",
])

export interface InterpretedQuery {
  original: string
  normalized: string
  tokens: string[]
  categoryQuery?: string
  subcategoryQuery?: string
  municipalityQuery?: string
  neighborhoodQuery?: string
  isUrgency: boolean
  isProximity: boolean
  isEmergency: boolean
  isOpenNow: boolean
  remainingTokens: string[]
}

export function interpretQuery(raw: string): InterpretedQuery {
  const normalized = raw.toLowerCase().trim()
  const tokens = normalized.split(/\s+/).filter(Boolean)
  const remainingTokens: string[] = [...tokens]

  const matched = {
    categoryQuery: undefined as string | undefined,
    subcategoryQuery: undefined as string | undefined,
    municipalityQuery: undefined as string | undefined,
    neighborhoodQuery: undefined as string | undefined,
  }

  const isUrgency = URGENCY_KEYWORDS.some((k) => tokens.includes(k))
  const isProximity = PROXIMITY_KEYWORDS.some((k) => normalized.includes(k))
  const isOpenNow = tokens.includes("abierto") || tokens.includes("abierta")
  const isEmergency = EMERGENCY_CATEGORIES.has(tokens[0] || "")

  if (isUrgency) {
    remainingTokens.forEach((t, i) => {
      if (URGENCY_KEYWORDS.includes(t)) remainingTokens[i] = ""
    })
  }

  return {
    original: raw,
    normalized,
    tokens,
    ...matched,
    isUrgency,
    isProximity,
    isEmergency,
    isOpenNow,
    remainingTokens: remainingTokens.filter(Boolean),
  }
}

export async function enrichInterpretation(
  interpretation: InterpretedQuery,
  getCategories: () => Promise<{ name: string; slug: string; id: string; subcategories: { name: string; slug: string; id: string }[] }[]>,
  getMunicipalities: () => Promise<{ name: string; slug: string; id: string; neighborhoods: { name: string; slug: string; id: string }[] }[]>
): Promise<InterpretedQuery> {
  const [categories, municipalities] = await Promise.all([getCategories(), getMunicipalities()])

  const remaining = [...interpretation.remainingTokens]

  for (const token of remaining) {
    const cat = categories.find(
      (c) => c.name.toLowerCase() === token || c.slug === token
    )
    if (cat) {
      interpretation.categoryQuery = cat.id
      removeToken(interpretation.remainingTokens, token)
      continue
    }

    for (const c of categories) {
      const sub = c.subcategories.find(
        (s) => s.name.toLowerCase() === token || s.slug === token
      )
      if (sub) {
        interpretation.subcategoryQuery = sub.id
        removeToken(interpretation.remainingTokens, token)
        break
      }
    }

    const mun = municipalities.find(
      (m) => m.name.toLowerCase() === token || m.slug === token
    )
    if (mun) {
      interpretation.municipalityQuery = mun.id
      removeToken(interpretation.remainingTokens, token)
      continue
    }

    for (const m of municipalities) {
      const n = m.neighborhoods.find(
        (n) => n.name.toLowerCase() === token || n.slug === token
      )
      if (n) {
        interpretation.neighborhoodQuery = n.id
        removeToken(interpretation.remainingTokens, token)
        break
      }
    }
  }

  return interpretation
}

function removeToken(tokens: string[], token: string) {
  const idx = tokens.indexOf(token)
  if (idx !== -1) tokens.splice(idx, 1)
}
