// Descarga una FOTO real y de licencia libre (Wikimedia Commons) por zona.
// Verifica que sea foto de verdad (jpeg, horizontal, >=60KB). Prueba varios
// candidatos y consultas; respaldo genérico de la ciudad si no hay referente.
// Guarda en public/zonas/{mun}/{slug}.jpg y créditos en public/zonas/CREDITS.md
//   node scripts/fetch-zone-images.mjs
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

const GENERIC = ["Guadalajara Jalisco", "Guadalajara skyline", "Guadalajara city"]
const ZONES = [
  { mun: "zapopan", slug: "zona-real", q: ["Andares Zapopan", "Zapopan Jalisco"] },
  { mun: "zapopan", slug: "andares-puerta-de-hierro", q: ["Puerta de Hierro Guadalajara", "Andares Zapopan"] },
  { mun: "zapopan", slug: "chapalita-ciudad-granja", q: ["Glorieta Chapalita Guadalajara", "Chapalita Guadalajara", "Zapopan Jalisco"] },
  { mun: "zapopan", slug: "centro-zapopan", q: ["Basílica de Zapopan", "Catedral de Zapopan", "Zapopan centro"] },
  { mun: "zapopan", slug: "sur-zapopan", q: ["Bosque La Primavera Jalisco", "Zapopan Jalisco"] },
  { mun: "guadalajara", slug: "centro-guadalajara", q: ["Catedral de Guadalajara Jalisco", "Centro Histórico Guadalajara", "Teatro Degollado"] },
  { mun: "guadalajara", slug: "americana-chapultepec", q: ["Templo Expiatorio Guadalajara", "Avenida Chapultepec Guadalajara", "Colonia Americana Guadalajara"] },
  { mun: "guadalajara", slug: "oblatos-tetlan", q: ["Parque Agua Azul Guadalajara", "Guadalajara Jalisco street"] },
  { mun: "guadalajara", slug: "huentitan", q: ["Barranca de Huentitán", "Mirador Independencia Guadalajara"] },
  { mun: "tlaquepaque", slug: "centro-tlaquepaque", q: ["El Parián Tlaquepaque", "Tlaquepaque Jalisco", "San Pedro Tlaquepaque"] },
  { mun: "tlaquepaque", slug: "revolucion-forum", q: ["Tlaquepaque Jalisco", "San Pedro Tlaquepaque"] },
  { mun: "tonala", slug: "centro-tonala", q: ["Tonalá Jalisco", "Tonalá centro Jalisco"] },
  { mun: "tonala", slug: "zona-artesanal-tonala", q: ["Cerámica Tonalá Jalisco", "Alfarería Jalisco", "Tonalá Jalisco"] },
  { mun: "tlajomulco", slug: "lopez-mateos-sur", q: ["Tlajomulco de Zúñiga", "López Mateos Guadalajara"] },
  { mun: "tlajomulco", slug: "tlajomulco-centro", q: ["Tlajomulco de Zúñiga", "Parroquia Tlajomulco"] },
]

const API = "https://commons.wikimedia.org/w/api.php"
const UA = "GuiaZMG/1.0 (hyperlocal zone hero images; contacto@guiazmg.com)"
const BAD = /(map|mapa|flag|bandera|escudo|seal|coat|logo|diagram|plan|location|locator|svg)/i
const strip = (s) => (s || "").replace(/<[^>]+>/g, "").trim()

async function candidates(query) {
  const url = `${API}?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=1600&format=json`
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) })
  if (!r.ok) return []
  const j = await r.json()
  return Object.values(j.query?.pages || {})
    .map((p) => ({ title: p.title || "", ii: p.imageinfo?.[0] }))
    .filter((c) => c.ii && /jpeg|jpg/i.test(c.ii.mime || "") && c.ii.width >= 1200 && c.ii.width >= c.ii.height && !BAD.test(c.title))
    .map((c) => ({
      thumburl: c.ii.thumburl || c.ii.url,
      descUrl: c.ii.descriptionurl || "",
      author: strip(c.ii.extmetadata?.Artist?.value) || "Wikimedia Commons",
      license: strip(c.ii.extmetadata?.LicenseShortName?.value) || "ver Commons",
      title: strip(c.ii.extmetadata?.ObjectName?.value) || c.title.replace(/^File:/, ""),
    }))
}

async function tryDownload(cand) {
  const img = await fetch(cand.thumburl, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) })
  if (!img.ok || !/image\/jpeg/i.test(img.headers.get("content-type") || "")) return null
  const buf = Buffer.from(await img.arrayBuffer())
  if (buf.length < 60000) return null // < 60KB = no es foto real
  return buf
}

const credits = ["# Créditos de imágenes de zona", "", "Fotos de referentes de cada zona — Wikimedia Commons (licencia libre).", ""]
let ok = 0, fail = 0
for (const z of ZONES) {
  let saved = null, used = null
  for (const q of [...z.q, ...GENERIC]) {
    let cands = []
    try { cands = await candidates(q) } catch { cands = [] }
    for (const c of cands) {
      let buf = null
      try { buf = await tryDownload(c) } catch { buf = null }
      if (buf) { saved = buf; used = { ...c, q }; break }
    }
    if (saved) break
  }
  if (!saved) { console.log(`✗ ${z.mun}/${z.slug} — sin foto`); fail++; continue }
  const out = join("public", "zonas", z.mun, `${z.slug}.jpg`)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, saved)
  console.log(`✓ ${z.mun}/${z.slug} — "${used.q}" (${Math.round(saved.length / 1024)}KB) · ${used.license} · ${used.author.slice(0, 36)}`)
  credits.push(`- **${z.mun}/${z.slug}** — ${used.title}. Autor: ${used.author}. Licencia: ${used.license}. Fuente: ${used.descUrl}`)
  ok++
}
writeFileSync(join("public", "zonas", "CREDITS.md"), credits.join("\n") + "\n")
console.log(`\nListas: ${ok} · fallidas: ${fail}`)
