// Unidades de medida para el precio de un producto del catálogo. Cubren los giros
// comunes: por pieza (abarrotes, panadería), por peso (carnicería, fruta), por
// volumen (líquidos), por longitud (tela/cable), y de servicio (por servicio/hora).
// Se guarda el `value` (código estable) en Listing.unit; el `label` es lo que se ve.
export const PRODUCT_UNITS = [
  { value: "pieza", label: "Pieza" },
  { value: "kg", label: "Kilo" },
  { value: "g", label: "Gramo" },
  { value: "litro", label: "Litro" },
  { value: "ml", label: "Mililitro" },
  { value: "metro", label: "Metro" },
  { value: "docena", label: "Docena" },
  { value: "paquete", label: "Paquete" },
  { value: "caja", label: "Caja" },
  { value: "porcion", label: "Porción" },
  { value: "servicio", label: "Servicio" },
  { value: "hora", label: "Hora" },
] as const

export type ProductUnit = (typeof PRODUCT_UNITS)[number]["value"]

export const PRODUCT_UNIT_VALUES = PRODUCT_UNITS.map((u) => u.value) as [string, ...string[]]

// Etiqueta legible de una unidad; null si no hay unidad o es desconocida.
export function unitLabel(value?: string | null): string | null {
  if (!value) return null
  return PRODUCT_UNITS.find((u) => u.value === value)?.label ?? null
}

// Sufijo para mostrar junto al precio: " / kilo", " / pieza", … ("" si no hay).
export function priceUnitSuffix(value?: string | null): string {
  const label = unitLabel(value)
  return label ? ` / ${label.toLowerCase()}` : ""
}
