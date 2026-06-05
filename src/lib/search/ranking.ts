export interface RankingWeights {
  textRelevance: number
  distance: number
  membership: number
  boost: number
  reviews: number
  verified: number
  openNow: number
  freshness: number
}

const DEFAULT_WEIGHTS: RankingWeights = {
  textRelevance: 40,
  distance: 20,
  membership: 10,
  boost: 10,
  reviews: 10,
  verified: 5,
  openNow: 3,
  freshness: 2,
}

const PLAN_PRIORITY_SCORES: Record<string, number> = {
  premium: 100,
  profesional: 60,
  basico: 20,
}

export function calculateScore(params: {
  textRelevance?: number
  distanceKm?: number
  planSlug?: string | null
  hasActiveBoost?: boolean
  avgRating?: number
  reviewCount?: number
  isVerified?: boolean
  isOpenNow?: boolean
  daysSinceCreated?: number
  weights?: Partial<RankingWeights>
}): number {
  const w = { ...DEFAULT_WEIGHTS, ...params.weights }

  const textScore = ((params.textRelevance ?? 0) / 100) * w.textRelevance

  const distKm = params.distanceKm ?? 999
  const distanceScore = distKm < 1 ? w.distance : Math.max(0, w.distance - distKm * 1.5)

  const planScore = params.planSlug
    ? (PLAN_PRIORITY_SCORES[params.planSlug.toLowerCase()] ?? 0) * (w.membership / 100)
    : 0

  const boostScore = params.hasActiveBoost ? w.boost : 0

  const rating = params.avgRating ?? 0
  const rCount = params.reviewCount ?? 0
  const reviewScore =
    (rating / 5) * Math.min(rCount / 10, 1) * w.reviews

  const verifiedScore = params.isVerified ? w.verified : 0

  const openNowScore = params.isOpenNow ? w.openNow : 0

  const days = params.daysSinceCreated ?? 999
  const freshnessScore = days < 7 ? w.freshness : Math.max(0, w.freshness * (1 - days / 90))

  return textScore + distanceScore + planScore + boostScore + reviewScore + verifiedScore + openNowScore + freshnessScore
}
