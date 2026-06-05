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
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
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
