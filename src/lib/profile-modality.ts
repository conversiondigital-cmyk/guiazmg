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
