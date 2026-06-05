export type PublicSourceType = "website" | "directory" | "profile"

export interface PublicSourceRecord {
  sourceType: PublicSourceType
  sourceUrl: string
  businessName?: string
  phone?: string | null
  whatsapp?: string | null
  websiteUrl?: string | null
  addressText?: string | null
  municipality?: string | null
  neighborhood?: string | null
  category?: string | null
  tags?: string[]
  description?: string | null
}

export interface ScraperRule {
  name: string
  allowedFields: Array<keyof PublicSourceRecord>
  blockPrivateData: boolean
}

export const PUBLIC_SCRAPER_RULES: ScraperRule[] = [
  {
    name: "public-business-profile",
    allowedFields: [
      "businessName",
      "phone",
      "whatsapp",
      "websiteUrl",
      "addressText",
      "municipality",
      "neighborhood",
      "category",
      "tags",
      "description",
      "sourceUrl",
      "sourceType",
    ],
    blockPrivateData: true,
  },
]

export function normalizePublicSource(record: PublicSourceRecord): PublicSourceRecord {
  return {
    ...record,
    businessName: record.businessName?.trim() || undefined,
    phone: record.phone?.trim() || null,
    whatsapp: record.whatsapp?.trim() || null,
    websiteUrl: record.websiteUrl?.trim() || null,
    addressText: record.addressText?.trim() || null,
    municipality: record.municipality?.trim() || null,
    neighborhood: record.neighborhood?.trim() || null,
    category: record.category?.trim() || null,
    description: record.description?.trim() || null,
    tags: record.tags?.map((tag) => tag.trim()).filter(Boolean),
  }
}

export function isAllowedPublicField(field: string): boolean {
  return PUBLIC_SCRAPER_RULES[0].allowedFields.includes(field as keyof PublicSourceRecord)
}

export function mapSourceToBusinessInput(record: PublicSourceRecord) {
  const normalized = normalizePublicSource(record)

  return {
    name: normalized.businessName || "Negocio sin nombre",
    phone: normalized.phone,
    whatsapp: normalized.whatsapp,
    websiteUrl: normalized.websiteUrl,
    addressText: normalized.addressText,
    description: normalized.description,
    categorySlug: normalized.category || undefined,
    municipalitySlug: normalized.municipality || undefined,
    neighborhoodSlug: normalized.neighborhood || undefined,
    sourceUrl: normalized.sourceUrl,
    sourceType: normalized.sourceType,
    tags: normalized.tags || [],
  }
}

export const publicScraper = {
  rules: PUBLIC_SCRAPER_RULES,
  normalize: normalizePublicSource,
  isAllowedField: isAllowedPublicField,
  mapToBusinessInput: mapSourceToBusinessInput,
}
