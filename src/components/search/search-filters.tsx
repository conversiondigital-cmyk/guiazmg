"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Category, Subcategory, Municipality, Neighborhood } from "@/types"

interface SearchFiltersProps {
  categories: (Category & { subcategories: Subcategory[] })[]
  municipalities: (Municipality & { neighborhoods: Neighborhood[] })[]
}

export function SearchFilters({ categories, municipalities }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get("category")
  const currentMunicipio = searchParams.get("municipio")

  // Acordeón: TODAS las categorías arrancan colapsadas para que la gente solo dé
  // clic en la que le interesa (se abre una a la vez).
  const [openCats, setOpenCats] = useState<Set<string>>(new Set())

  const toggle = (slug: string) =>
    setOpenCats((prev) => {
      const n = new Set(prev)
      if (n.has(slug)) n.delete(slug)
      else n.add(slug)
      return n
    })

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categorías</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[70vh] space-y-0.5 overflow-y-auto">
          <Button
            variant={!currentCategory ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => updateFilter("category", null)}
          >
            Todas las categorías
          </Button>
          {categories.map((cat) => {
            const open = openCats.has(cat.slug)
            const active = currentCategory === cat.slug
            const childActive = cat.subcategories?.some((c) => c.slug === currentCategory)
            const hasChildren = (cat.subcategories?.length ?? 0) > 0
            return (
              <div key={cat.id}>
                <button
                  type="button"
                  onClick={() => (hasChildren ? toggle(cat.slug) : updateFilter("category", cat.slug))}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-gray-50",
                    (active || childActive) && "font-semibold text-green-800"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {cat.icon && <span className="shrink-0">{cat.icon}</span>}
                    <span className="truncate">{cat.name}</span>
                  </span>
                  {hasChildren && (
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 text-gray-400 transition-transform", open && "rotate-180")}
                    />
                  )}
                </button>
                {open && hasChildren && (
                  <div className="mb-1 ml-3 space-y-0.5 border-l border-gray-100 pl-2">
                    <button
                      type="button"
                      onClick={() => updateFilter("category", cat.slug)}
                      className={cn(
                        "block w-full truncate rounded-md px-2 py-1 text-left text-xs transition-colors hover:bg-gray-50",
                        active ? "font-semibold text-green-800" : "text-gray-500"
                      )}
                    >
                      Todos en {cat.name}
                    </button>
                    {cat.subcategories.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => updateFilter("category", child.slug)}
                        className={cn(
                          "block w-full truncate rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-gray-50",
                          currentCategory === child.slug ? "font-semibold text-green-800" : "text-gray-600"
                        )}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Municipio</CardTitle>
        </CardHeader>
        <CardContent className="max-h-72 space-y-1 overflow-y-auto">
          <Button
            variant={!currentMunicipio ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => updateFilter("municipio", null)}
          >
            Todos
          </Button>
          {municipalities.map((m) => (
            <Button
              key={m.id}
              variant={currentMunicipio === m.slug ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => updateFilter("municipio", m.slug)}
            >
              {m.name}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
