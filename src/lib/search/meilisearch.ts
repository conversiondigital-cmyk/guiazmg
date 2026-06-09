/**
 * Meilisearch client + indexing helpers
 * Production: MEILISEARCH_HOST + MEILISEARCH_API_KEY env vars
 * Dev: can run locally on http://localhost:7700
 */

import { Meilisearch } from "meilisearch"

// ─── Client (lazy singleton) ─────────────────────────────────────────────────

let _client: Meilisearch | null = null

export function getMeiliClient(): Meilisearch | null {
  if (!process.env.MEILISEARCH_HOST) return null

  if (!_client) {
    _client = new Meilisearch({
      host: process.env.MEILISEARCH_HOST,
      apiKey: process.env.MEILISEARCH_API_KEY ?? "",
    })
  }
  return _client
}

// ─── Index names ─────────────────────────────────────────────────────────────

export const INDEX_PROFILES = "profiles"
export const INDEX_PRODUCTS  = "products"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MeiliProfile {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  categoryName: string | null
  categorySlug: string | null
  municipalityName: string | null
  isVerified: boolean
  isFeatured: boolean
  coverImageUrl: string | null
  /** Composed field for full-text search */
  _text: string
}

export interface MeiliProduct {
  id: string
  name: string
  slug: string
  description: string | null
  price: number | null
  profileId: string
  profileName: string
  categoryName: string | null
  municipalityName: string | null
}

// ─── Configure indexes (run once at startup / migration) ─────────────────────

export async function configureMeiliIndexes() {
  const client = getMeiliClient()
  if (!client) return

  // Profiles index
  await client.index(INDEX_PROFILES).updateSettings({
    searchableAttributes: ["name", "shortDescription", "_text", "categoryName", "municipalityName"],
    filterableAttributes: ["categorySlug", "municipalityName", "isVerified", "isFeatured"],
    sortableAttributes: ["name"],
    rankingRules: [
      "words", "typo", "proximity", "attribute", "sort", "exactness",
    ],
    typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } },
  })

  // Products index
  await client.index(INDEX_PRODUCTS).updateSettings({
    searchableAttributes: ["name", "description", "profileName", "categoryName"],
    filterableAttributes: ["categoryName", "municipalityName"],
  })
}

// ─── Indexing helpers ─────────────────────────────────────────────────────────

export async function indexProfile(profile: MeiliProfile) {
  const client = getMeiliClient()
  if (!client) return
  try {
    await client.index(INDEX_PROFILES).addDocuments([profile])
  } catch (err) {
    console.error("[meilisearch] indexProfile error:", err)
  }
}

export async function removeProfile(id: string) {
  const client = getMeiliClient()
  if (!client) return
  try {
    await client.index(INDEX_PROFILES).deleteDocument(id)
  } catch (err) {
    console.error("[meilisearch] removeProfile error:", err)
  }
}

export async function bulkIndexProfiles(profiles: MeiliProfile[]) {
  const client = getMeiliClient()
  if (!client) return
  try {
    const BATCH = 100
    for (let i = 0; i < profiles.length; i += BATCH) {
      await client.index(INDEX_PROFILES).addDocuments(profiles.slice(i, i + BATCH))
    }
    console.log(`[meilisearch] Indexed ${profiles.length} profiles`)
  } catch (err) {
    console.error("[meilisearch] bulkIndexProfiles error:", err)
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchOptions {
  query: string
  category?: string
  municipality?: string
  limit?: number
  offset?: number
}

export interface SearchResult {
  hits: MeiliProfile[]
  totalHits: number
  processingTimeMs: number
  source: "meilisearch" | "postgres"
}

export async function searchProfiles(opts: SearchOptions): Promise<SearchResult | null> {
  const client = getMeiliClient()
  if (!client) return null

  const filters: string[] = []
  if (opts.category)     filters.push(`categorySlug = "${opts.category}"`)
  if (opts.municipality) filters.push(`municipalityName = "${opts.municipality}"`)

  try {
    const result = await client.index(INDEX_PROFILES).search(opts.query, {
      limit:  opts.limit  ?? 20,
      offset: opts.offset ?? 0,
      filter: filters.length ? filters.join(" AND ") : undefined,
    })

    return {
      hits: result.hits as MeiliProfile[],
      totalHits: result.estimatedTotalHits ?? result.hits.length,
      processingTimeMs: result.processingTimeMs,
      source: "meilisearch",
    }
  } catch (err) {
    console.error("[meilisearch] searchProfiles error:", err)
    return null
  }
}
