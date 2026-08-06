// Server Component: es puramente presentacional (Links + iconos + hover CSS, sin
// estado ni handlers). Quitar "use client" lo saca del bundle del cliente junto con
// sus ~20 iconos de lucide.
import Link from "next/link"
import {
  Utensils, Coffee, Heart, Scissors, Car, Dumbbell, GraduationCap, PawPrint,
  Sofa, HardHat, Laptop, Building2, PartyPopper, Briefcase, Shirt, Hotel,
  Wrench, ShoppingBasket, Flower2, LayoutGrid, ArrowRight,
} from "lucide-react"
import type { Category, Subcategory } from "@/types"

interface CategoryWithCount extends Category {
  subcategories: Subcategory[]
  _count?: { businesses: number }
}

interface CategoryGridProps {
  categories: CategoryWithCount[]
  /** Variante compacta sin el panel decorativo (fondo lila + margen negativo)
   * del home. Se usa dentro de contenedores ya acolchados como /cuenta, donde
   * ese margen negativo se comía las tarjetas de arriba. */
  bare?: boolean
}

const ICON_MAP: Record<string, React.ElementType> = {
  restaurantes: Utensils, alimentacion: Utensils, cafeterias: Coffee,
  salud: Heart, belleza: Scissors, automotriz: Car, gimnasios: Dumbbell,
  educacion: GraduationCap, mascotas: PawPrint, hogar: Sofa, construccion: HardHat,
  tecnologia: Laptop, inmobiliaria: Building2, entretenimiento: PartyPopper,
  profesionales: Briefcase, moda: Shirt, eventos: PartyPopper, turismo: Hotel,
  servicios: Wrench, compras: ShoppingBasket, florerias: Flower2, bienestar: Flower2,
}

// Tintes pastel del recuadro del ícono, alternados como en el diseño.
const PALETTE = [
  { bg: "bg-[#d8f0e6]", fg: "text-[#0f7a52]" }, // verde menta
  { bg: "bg-[#fde4de]", fg: "text-[#e76f51]" }, // coral
  { bg: "bg-[#d8f0e6]", fg: "text-[#0b3d2e]" }, // verde oscuro
  { bg: "bg-[#dcefe6]", fg: "text-[#0f7a52]" }, // verde
  { bg: "bg-[#dce8fb]", fg: "text-[#3b6fd4]" }, // azul
  { bg: "bg-[#fde4de]", fg: "text-[#e76f51]" }, // coral
]

export function CategoryGrid({ categories, bare = false }: CategoryGridProps) {
  const shown = categories.slice(0, 6)

  const content = (
    <>
      <div className={`flex items-end justify-between ${bare ? "mb-5" : "mb-10"}`}>
        <div>
          <h2
            className={`font-bold text-[#003527] ${bare ? "mb-1 text-xl" : "mb-2 text-2xl md:text-3xl"}`}
          >
            Explora por Categorías
          </h2>
          <p className={`text-[#404944] ${bare ? "text-sm" : ""}`}>
            Todo lo que necesitas, a un clic de distancia.
          </p>
        </div>
        <Link
          href="/search"
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-[#003527] hover:underline"
        >
          Ver todas <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className={`grid grid-cols-3 sm:grid-cols-6 ${bare ? "gap-3" : "grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-6"}`}>
        {shown.map((cat, i) => {
          const Icon = ICON_MAP[cat.slug] ?? LayoutGrid
          const c = PALETTE[i % PALETTE.length]
          return (
            <Link
              key={cat.id}
              href={`/categoria/${cat.slug}`}
              className={`group flex flex-col items-center gap-3 rounded-2xl bg-white text-center shadow-[0_6px_24px_rgba(11,28,48,0.05)] ring-1 ring-black/[0.02] transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(11,28,48,0.10)] ${bare ? "p-4" : "p-6"}`}
            >
              <div
                className={`flex items-center justify-center rounded-2xl ${c.bg} ${bare ? "h-11 w-11" : "h-16 w-16"}`}
              >
                <Icon className={`${bare ? "h-5 w-5" : "h-7 w-7"} ${c.fg}`} strokeWidth={1.8} />
              </div>
              <span className={`font-medium text-[#1a6453] ${bare ? "text-[13px]" : "text-[15px]"}`}>
                {cat.name}
              </span>
            </Link>
          )
        })}
      </div>
    </>
  )

  if (bare) return <section>{content}</section>

  return (
    <div className="relative z-10 -mt-8 rounded-t-[2rem] bg-[#f8f9ff]">
      <section className="mx-auto max-w-[1080px] px-4 pb-20 pt-14 sm:px-6 sm:pt-16 lg:px-10">
        {content}
      </section>
    </div>
  )
}
