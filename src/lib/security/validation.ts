import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(50),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
  referralCode: z.string().optional(),
})

export const businessSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(200),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  municipalityId: z.string().optional(),
  neighborhoodId: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  phone: z.string().regex(/^[0-9+\-\s()]{7,20}$/, "Teléfono inválido").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  addressText: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

export const marketplaceListingSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres").max(200),
  description: z.string().max(5000).optional(),
  price: z.number().min(0).optional(),
  type: z.enum(["SALE", "PURCHASE", "TRADE", "SERVICE", "REQUEST", "EVENT", "PROMOTION"]),
  categoryId: z.string().min(1, "Categoría requerida"),
  municipalityId: z.string().optional(),
  neighborhood: z.string().max(100).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
})

export const serviceRequestSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  categoryId: z.string().optional(),
  municipalityId: z.string().optional(),
  neighborhood: z.string().max(100).optional(),
})

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(2000).optional(),
})

export const searchSchema = z.object({
  q: z.string().max(200).optional(),
  category: z.string().optional(),
  municipality: z.string().optional(),
  neighborhood: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const paymentPreferenceSchema = z.object({
  type: z.enum(["membership", "boost"]),
  plan: z.string().optional(),
  businessId: z.string().optional(),
  boostDefinitionId: z.string().optional(),
  listingId: z.string().optional(),
  couponCode: z.string().optional(),
})

export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim()
}

export function validateAndSanitize<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: boolean; data?: T; errors?: string[] } {
  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
    }
  }
  return { success: true, data: result.data }
}
