"use client"

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
}

const ICON_MAP: Record<string, React.ElementType> = {
  restaurantes: Utensils, alimentacion: Utensils, cafeterias: Coffee,
  salud: Heart, belleza: Scissors, automotriz: Car, gimnasios: Dumbbell,
  educacion: GraduationCap, mascotas: PawPrint, hogar: Sofa, construccion: HardHat,
  tecnologia: Laptop, inmobiliaria: Building2, entretenimiento: PartyPopper,
  profesionales: Briefcase, moda: Shirt, eventos: PartyPopper, turismo: Hotel,
  servicios: Wrench, compras: ShoppingBasket, florerias: Flower2,
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const shown = categories.slice(0, 6)

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 lg:px-10">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold text-[#003527] sm:text-[32px]">Explora por Categorías</h2>
          <p className="text-[#404944]">Todo lo que necesitas, a un clic de distancia.</p>
        </div>
        <Link
          href="/search"
          className="flex items-center gap-1 text-sm font-semibold text-[#003527] hover:underline"
        >
          Ver todas <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-6">
        {shown.map((cat) => {
          const Icon = ICON_MAP[cat.slug] ?? LayoutGrid
          return (
            <Link key={cat.id} href={`/categoria/${cat.slug}`} className="group text-center">
              <div className="mb-4 flex aspect-square w-full items-center justify-center rounded-3xl border border-[#bfc9c3]/20 bg-[#064e3b] p-8 shadow-sm transition-all group-hover:opacity-90 group-hover:shadow-md">
                <Icon className="h-12 w-12 text-[#80bea6]" strokeWidth={1.5} />
              </div>
              <span className="text-lg font-semibold text-[#0b1c30]">{cat.name}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
