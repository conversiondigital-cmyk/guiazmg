// Módulo PLANO (sin "use client"): lo comparten la página (Server Component) y
// la gráfica (Client Component). Si esto viviera en analytics-charts.tsx
// ("use client"), la página lo recibiría como "client reference" y no como el
// array real → CONTACT_SERIES.map(...) en el servidor reventaría el render.

export type ContactsDatum = {
  date: string
  whatsapp: number
  phone: number
  website: number
  map: number
  social: number
}

// Series de contacto (canal → etiqueta/color). Se comparten con el desglose.
export const CONTACT_SERIES = [
  { key: "whatsapp", label: "WhatsApp", color: "#22c55e" },
  { key: "phone", label: "Llamadas", color: "#f97316" },
  { key: "website", label: "Sitio web", color: "#8b5cf6" },
  { key: "map", label: "Mapa / Ruta", color: "#ef4444" },
  { key: "social", label: "Redes", color: "#3b82f6" },
] as const
