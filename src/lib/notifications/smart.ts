export interface SmartNotificationContext {
  city?: string | null
  municipality?: string | null
  neighborhood?: string | null
  category?: string | null
  title?: string | null
  type?: "business" | "promotion" | "marketplace" | "news"
}

export interface SmartNotification {
  title: string
  message: string
  segment: string
  priority: "low" | "medium" | "high"
}

export function buildSmartNotification(context: SmartNotificationContext): SmartNotification {
  const location = context.neighborhood || context.municipality || context.city || "tu zona"
  const category = context.category || "nueva oportunidad"

  switch (context.type) {
    case "promotion":
      return {
        title: `Nueva promoción cerca de ${location}`,
        message: context.title || `Se publicó una nueva promoción en ${location}.`,
        segment: `${location}:${category}:promotion`,
        priority: "medium",
      }
    case "marketplace":
      return {
        title: `Nueva venta en ${location}`,
        message: context.title || `Hay una nueva publicación en marketplace cerca de ${location}.`,
        segment: `${location}:${category}:marketplace`,
        priority: "medium",
      }
    case "news":
      return {
        title: `Novedades en ${location}`,
        message: context.title || `Se detectó actividad nueva en ${location}.`,
        segment: `${location}:${category}:news`,
        priority: "low",
      }
    default:
      return {
        title: `Nuevo negocio cerca de ${location}`,
        message: context.title || `Se registró un nuevo negocio de ${category} cerca de ${location}.`,
        segment: `${location}:${category}:business`,
        priority: "high",
      }
  }
}

export function buildNotificationSegments(context: SmartNotificationContext): string[] {
  const location = context.neighborhood || context.municipality || context.city || "all"
  const category = context.category || "all"
  return [
    `${location}`,
    `${location}:${category}`,
    `${location}:${category}:${context.type || "business"}`,
  ]
}

export const smartNotifications = {
  build: buildSmartNotification,
  segments: buildNotificationSegments,
}
