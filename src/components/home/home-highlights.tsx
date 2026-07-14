import Link from "next/link"
import { getSetting, getSettingBool } from "@/lib/settings"

// Sección administrable de la landing: el admin la edita en
// Admin → Configuración → Landing (anuncios / top de negocios o emprendedores).
// Cada línea de "home_highlights_items" es una tarjeta con formato:
//   Título | Descripción | enlace
// El enlace es opcional; si empieza con http es externo, si no es una ruta interna.
interface Item {
  title: string
  desc: string
  link: string
}

function parseItems(raw: string): Item[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [title = "", desc = "", link = ""] = line.split("|").map((p) => p.trim())
      return { title, desc, link }
    })
    .filter((i) => i.title)
    .slice(0, 8)
}

export async function HomeHighlights() {
  const enabled = await getSettingBool("home_highlights_enabled")
  if (!enabled) return null

  const [title, subtitle, itemsRaw] = await Promise.all([
    getSetting("home_highlights_title"),
    getSetting("home_highlights_subtitle"),
    getSetting("home_highlights_items"),
  ])

  const items = parseItems(itemsRaw)
  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-[1080px] px-4 py-10 sm:px-6 lg:px-10">
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8">
        <div className="mb-6">
          <span className="inline-block rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Destacado
          </span>
          <h2 className="mt-3 text-2xl font-bold text-[#003527] sm:text-3xl">
            {title || "Lo destacado de la semana"}
          </h2>
          {subtitle && <p className="mt-1 text-[#404944]">{subtitle}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const inner = (
              <div className="flex h-full items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_4px_18px_rgba(11,28,48,0.05)] ring-1 ring-black/[0.02] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(11,28,48,0.10)]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#0b1c30]">{item.title}</h3>
                  {item.desc && <p className="mt-0.5 text-sm text-[#404944]">{item.desc}</p>}
                </div>
              </div>
            )
            if (!item.link) return <div key={i}>{inner}</div>
            if (/^https?:\/\//.test(item.link)) {
              return (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              )
            }
            return (
              <Link key={i} href={item.link}>
                {inner}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
