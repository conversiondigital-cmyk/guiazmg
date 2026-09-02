import { NextResponse } from "next/server"

// Detección de zona por IP (borde de Vercel), sin permisos y SIN tocar la BD.
// Devuelve solo el SLUG del municipio si la ciudad detectada es de la ZMG; no
// guarda ni expone la ubicación precisa. La usa un banner cliente para SUGERIR
// (no forzar) la landing de la zona del visitante.
export const dynamic = "force-dynamic"

// Ciudades que reporta Vercel (x-vercel-ip-city) → slug del municipio (catálogo real).
const CITY_TO_MUNI: Record<string, string> = {
  "guadalajara": "guadalajara",
  "zapopan": "zapopan",
  "tlaquepaque": "tlaquepaque",
  "san pedro tlaquepaque": "tlaquepaque",
  "tonala": "tonala",
  "tlajomulco": "tlajomulco",
  "tlajomulco de zuniga": "tlajomulco",
  "el salto": "el-salto",
  "ixtlahuacan de los membrillos": "ixtlahuacan-de-los-membrillos",
  "ixtlahuacan": "ixtlahuacan-de-los-membrillos",
  "juanacatlan": "juanacatlan",
}

const MUNI_NAMES: Record<string, string> = {
  "guadalajara": "Guadalajara",
  "zapopan": "Zapopan",
  "tlaquepaque": "Tlaquepaque",
  "tonala": "Tonalá",
  "tlajomulco": "Tlajomulco",
  "el-salto": "El Salto",
  "ixtlahuacan-de-los-membrillos": "Ixtlahuacán de los Membrillos",
  "juanacatlan": "Juanacatlán",
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export async function GET(req: Request) {
  const country = req.headers.get("x-vercel-ip-country") || ""
  const rawCity = req.headers.get("x-vercel-ip-city") || ""
  let city = ""
  try {
    city = decodeURIComponent(rawCity)
  } catch {
    city = rawCity
  }

  // Solo sugerimos zonas de la ZMG a visitantes en México (evita falsos positivos,
  // p. ej. Guadalajara, España). Si no hay match, muni = null y el banner no aparece.
  let muni: string | null = null
  if (country === "MX" && city) {
    muni = CITY_TO_MUNI[norm(city)] ?? null
  }

  return NextResponse.json(
    { muni, name: muni ? MUNI_NAMES[muni] : null },
    { headers: { "Cache-Control": "no-store" } }
  )
}
