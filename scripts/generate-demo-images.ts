/**
 * Genera las imágenes SVG de los negocios demo en public/demo/<slug>/.
 * No se guardan en la BD: la BD solo referencia las rutas /demo/<slug>/*.svg.
 *
 *   npx tsx scripts/generate-demo-images.ts
 */
import fs from "fs"
import path from "path"
import { DEMO_CATEGORY_BY_SLUG, DEMO_CATEGORIES } from "../src/lib/demo/demo-categories"

const ROOT = process.cwd()
const DATA = path.join(ROOT, "src/lib/demo/demo-businesses.json")
const OUT = path.join(ROOT, "public/demo")

const EMOJI_FONT = "'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif"
const SANS = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// Parte el nombre en hasta `max` líneas de ~`width` caracteres.
function wrap(name: string, width: number, max = 2): string[] {
  const words = name.split(/\s+/)
  const lines: string[] = []
  let cur = ""
  for (const w of words) {
    if ((cur + " " + w).trim().length > width && cur) {
      lines.push(cur.trim())
      cur = w
    } else {
      cur = (cur + " " + w).trim()
    }
    if (lines.length === max - 1 && cur.length > width) break
  }
  if (cur) lines.push(cur.trim())
  if (lines.length > max) {
    const kept = lines.slice(0, max)
    kept[max - 1] = kept[max - 1].slice(0, width - 1) + "…"
    return kept.map(esc)
  }
  return lines.map(esc)
}

function defs(c1: string, c2: string, angle: "diag" | "rev" | "vert" = "diag"): string {
  const coords =
    angle === "diag" ? `x1="0" y1="0" x2="1" y2="1"`
      : angle === "rev" ? `x1="1" y1="0" x2="0" y2="1"`
        : `x1="0" y1="0" x2="0" y2="1"`
  return `<defs>
    <linearGradient id="g" ${coords}>
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.22" r="0.85">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.20"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="46" height="46" patternUnits="userSpaceOnUse">
      <circle cx="6" cy="6" r="2.6" fill="#ffffff" fill-opacity="0.07"/>
    </pattern>
  </defs>`
}

function cover(name: string, catName: string, emoji: string, c1: string, c2: string): string {
  const lines = wrap(name, 22, 2)
  const nameSvg = lines
    .map((ln, i) => `<text x="64" y="${(lines.length === 1 ? 560 : 520) + i * 74}" font-size="66" font-weight="800" fill="#ffffff" font-family="${SANS}">${ln}</text>`)
    .join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  ${defs(c1, c2, "diag")}
  <rect width="1200" height="675" fill="url(#g)"/>
  <rect width="1200" height="675" fill="url(#dots)"/>
  <rect width="1200" height="675" fill="url(#glow)"/>
  <text x="940" y="300" font-size="330" text-anchor="middle" dominant-baseline="central" font-family="${EMOJI_FONT}" opacity="0.95">${emoji}</text>
  <text x="64" y="86" font-size="26" letter-spacing="4" font-weight="700" fill="#ffffff" fill-opacity="0.85" font-family="${SANS}">${esc(catName.toUpperCase())}</text>
  ${nameSvg}
  <text x="1136" y="636" font-size="26" text-anchor="end" font-weight="800" fill="#ffffff" fill-opacity="0.75" font-family="${SANS}">Guía ZMG</text>
</svg>`
}

function logo(emoji: string, c1: string, c2: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  ${defs(c1, c2, "diag")}
  <rect width="480" height="480" rx="104" fill="url(#g)"/>
  <rect width="480" height="480" rx="104" fill="url(#dots)"/>
  <rect width="480" height="480" rx="104" fill="url(#glow)"/>
  <text x="240" y="252" font-size="232" text-anchor="middle" dominant-baseline="central" font-family="${EMOJI_FONT}">${emoji}</text>
</svg>`
}

function gallery(catName: string, emoji: string, c1: string, c2: string, n: number): string {
  const angle = n === 1 ? "diag" : n === 2 ? "rev" : "vert"
  const ex = n === 1 ? 450 : n === 2 ? 300 : 600
  const ey = n === 1 ? 430 : n === 2 ? 330 : 540
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  ${defs(c1, c2, angle as "diag" | "rev" | "vert")}
  <rect width="900" height="900" fill="url(#g)"/>
  <rect width="900" height="900" fill="url(#dots)"/>
  <rect width="900" height="900" fill="url(#glow)"/>
  <text x="${ex}" y="${ey}" font-size="300" text-anchor="middle" dominant-baseline="central" font-family="${EMOJI_FONT}" opacity="0.96">${emoji}</text>
  <text x="450" y="830" font-size="34" text-anchor="middle" font-weight="700" letter-spacing="2" fill="#ffffff" fill-opacity="0.85" font-family="${SANS}">${esc(catName)}</text>
</svg>`
}

type Biz = { slug: string; name: string; categorySlug: string }

function main() {
  if (!fs.existsSync(DATA)) {
    throw new Error(`No existe ${DATA}. Corre primero el workflow de generación de negocios demo.`)
  }
  const businesses: Biz[] = JSON.parse(fs.readFileSync(DATA, "utf8"))
  let files = 0
  for (const biz of businesses) {
    const cat = DEMO_CATEGORY_BY_SLUG[biz.categorySlug] ?? DEMO_CATEGORIES[0]
    const dir = path.join(OUT, biz.slug)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, "cover.svg"), cover(biz.name, cat.name, cat.emoji, cat.color1, cat.color2))
    fs.writeFileSync(path.join(dir, "logo.svg"), logo(cat.emoji, cat.color1, cat.color2))
    for (let n = 1; n <= 3; n++) {
      fs.writeFileSync(path.join(dir, `g${n}.svg`), gallery(cat.name, cat.emoji, cat.color1, cat.color2, n))
    }
    files += 5
  }
  console.log(`OK: ${businesses.length} negocios → ${files} imágenes SVG en public/demo/`)
}

main()
