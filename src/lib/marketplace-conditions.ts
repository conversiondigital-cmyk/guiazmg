// Condición / estado del artículo en el marketplace. Valor en BD (String) + etiqueta
// y color para la insignia. Compartido por el formulario, las tarjetas y el detalle.
export const LISTING_CONDITIONS = [
  { value: "NEW", label: "Nuevo", badge: "bg-emerald-100 text-emerald-700" },
  { value: "LIKE_NEW", label: "Poco uso", badge: "bg-teal-100 text-teal-700" },
  { value: "USED", label: "Usado", badge: "bg-amber-100 text-amber-700" },
  { value: "WITH_DETAILS", label: "Usado con detalles", badge: "bg-orange-100 text-orange-700" },
] as const

export type ListingConditionValue = (typeof LISTING_CONDITIONS)[number]["value"]

export const CONDITION_VALUES = LISTING_CONDITIONS.map((c) => c.value) as [string, ...string[]]

const BY_VALUE = new Map<string, (typeof LISTING_CONDITIONS)[number]>(
  LISTING_CONDITIONS.map((c) => [c.value, c]),
)

export function conditionLabel(value: string | null | undefined): string | null {
  return value ? BY_VALUE.get(value)?.label ?? null : null
}
export function conditionBadge(value: string | null | undefined): string {
  return (value && BY_VALUE.get(value)?.badge) || "bg-gray-100 text-gray-600"
}

// La condición solo aplica a artículos físicos que se venden/intercambian.
export function conditionAppliesTo(type: string): boolean {
  return type === "SALE" || type === "TRADE" || type === "PURCHASE" || type === "REQUEST"
}
