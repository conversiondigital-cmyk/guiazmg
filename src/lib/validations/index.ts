import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  phone: z.string().optional(),
})

export const businessSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  shortDescription: z.string().max(200).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(10).refine((v) => (v.match(/\d/g)?.length ?? 0) >= 10, "El teléfono debe tener al menos 10 dígitos"),
  whatsapp: z.string().min(10).refine((v) => (v.match(/\d/g)?.length ?? 0) >= 10, "El WhatsApp debe tener al menos 10 dígitos"),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  tiktokUrl: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  wazeUrl: z.string().optional(),
  addressText: z.string().optional(),
  postalCode: z.string().optional(),
  municipalityId: z.string().optional(),
  neighborhoodId: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  hours: z
    .array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        opensAt: z.string(),
        closesAt: z.string(),
      })
    )
    .optional(),
})

export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  municipality: z.string().optional(),
  neighborhood: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
})

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
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
