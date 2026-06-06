"use client"

import Link from "next/link"
import {
  Utensils, Heart, Home, Car, Scissors, Wrench, Grid3x3,
} from "lucide-react"
import type { Category, Subcategory } from "@/types"

interface CategoryWithCount extends Category {
  subcategories: Subcategory[]
  _count?: { businesses: number }
}

interface CategoryGridProps {
  categories: CategoryWithCount[]
}

const ICON_MAP: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  alimentacion:  { icon: Utensils,  color: "text-orange-600",  bg: "bg-orange-100" },
  salud:         { icon: Heart,     color: "text-red-600",     bg: "bg-red-100" },
  hogar:         { icon: Home,      color: "text-blue-600",    bg: "bg-blue-100" },
  automotriz:    { icon: Car,       color: "text-slate-600",   bg: "bg-slate-100" },
  belleza:       { icon: Scissors,  color: "text-pink-600",    bg: "bg-pink-100" },
  servicios:     { icon: Wrench,    color: "text-green-700",   bg: "bg-green-100" },
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`
  return `${n}+`
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const shown = categories.slice(0, 6)

  return (
    <section className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
            Explora por categorías
          </p>
          <h2 className="text-3xl font-black text-gray-900">
            Encuentra exactamente lo que necesitas
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-7">
          {shown.map((cat) => {
            const meta = ICON_MAP[cat.slug] ?? { icon: Grid3x3, color: "text-gray-600", bg: "bg-gray-100" }
            const Icon = meta.icon
            const count = cat._count?.businesses ?? 0
            return (
              <Link
                key={cat.id}
                href={`/categoria/${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl bg-white p-4 text-center shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${meta.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-7 w-7 ${meta.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-green-800 transition-colors leading-tight">
                    {cat.name}
                  </p>
                  {count > 0 && (
                    <p className="text-xs font-bold text-amber-600 mt-0.5">{formatCount(count)}</p>
                  )}
                </div>
              </Link>
            )
          })}

          {/* Ver todas */}
          <Link
            href="/search"
            className="group flex flex-col items-center gap-3 rounded-2xl bg-green-800 p-4 text-center shadow-sm hover:bg-green-900 transition-colors"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 group-hover:scale-110 transition-transform">
              <Grid3x3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Ver todas</p>
              <p className="text-xs font-bold text-green-200 mt-0.5">+20 categorías</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
