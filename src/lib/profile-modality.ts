// Modalidades de atención de un perfil comercial (sobre todo Emprendedor: por
// pedido, a domicilio, WhatsApp, catálogo…). Módulo plano (sin "use client")
// para poder importarse tanto en el wizard (cliente) como en el perfil (servidor).
export interface ServiceMode {
  code: string
  label: string
}

export const SERVICE_MODES: ServiceMode[] = [
  { code: "por_pedido", label: "Por pedido" },
  { code: "domicilio", label: "Entrega a domicilio" },
  { code: "punto_encuentro", label: "Punto de encuentro" },
  { code: "whatsapp", label: "Atención por WhatsApp" },
  { code: "catalogo", label: "Venta por catálogo" },
  { code: "cita", label: "Servicios por cita" },
  { code: "sin_local", label: "Sin local físico" },
]

const LABELS: Record<string, string> = Object.fromEntries(SERVICE_MODES.map((m) => [m.code, m.label]))

export function serviceModeLabel(code: string): string {
  return LABELS[code] ?? code
}

// Visibilidad de la ubicación de un perfil. Separa "dónde vive/opera" de "dónde
// atiende": quien trabaja desde casa NO debe publicar su dirección exacta.
export interface LocationVisibilityOption {
  code: string
  label: string
  hint: string
}

export const LOCATION_VISIBILITY: LocationVisibilityOption[] = [
  {
    code: "PUBLIC",
    label: "Pública — dirección y mapa",
    hint: "Para negocios con local abierto al público. Muestra tu dirección exacta y el mapa.",
  },
  {
    code: "APPROX",
    label: "Aproximada — solo tu zona",
    hint: "Muestra tu municipio y colonia, pero NO la dirección exacta ni el mapa.",
  },
  {
    code: "PRIVATE",
    label: "Privada — no mostrar ubicación",
    hint: "No se publica dirección, mapa ni coordenadas. Recomendado si trabajas desde casa o atiendes a domicilio.",
  },
]

const LOCVIS_LABELS: Record<string, string> = Object.fromEntries(
  LOCATION_VISIBILITY.map((v) => [v.code, v.label])
)

export function locationVisibilityLabel(code: string | null | undefined): string {
  return LOCVIS_LABELS[code ?? "PUBLIC"] ?? "Pública"
}
