// Extrae CP, colonia y municipio de los address_components de un resultado de
// Google (geocoding o places), para autocompletar esos campos al mover el pin o
// elegir una dirección.
type Comp = { long_name: string; short_name: string; types: string[] }

export type ResolvedPlace = {
  address: string
  lat: number
  lng: number
  postalCode?: string
  neighborhood?: string
  municipality?: string
}

export function parseAddressComponents(comps: Comp[] | undefined): {
  postalCode?: string
  neighborhood?: string
  municipality?: string
} {
  const get = (type: string) => comps?.find((c) => c.types.includes(type))
  return {
    postalCode: get("postal_code")?.long_name,
    neighborhood:
      (get("sublocality_level_1") ?? get("neighborhood") ?? get("sublocality"))?.long_name,
    // En México el municipio suele venir como locality; a veces admin_area_level_2.
    municipality: (get("locality") ?? get("administrative_area_level_2"))?.long_name,
  }
}

// Normaliza para comparar nombres (sin acentos ni mayúsculas).
export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
}
