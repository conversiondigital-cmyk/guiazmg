"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
        <CardContent className="space-y-1">
          <Button
            variant={!currentCategory ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => updateFilter("category", null)}
          >
            Todas
          </Button>
          {categories.map((cat) => (
            <div key={cat.id}>
              <Button
                variant={currentCategory === cat.slug ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => updateFilter("category", cat.slug)}
              >
                {cat.icon && <span className="mr-2">{cat.icon}</span>}
                {cat.name}
              </Button>
              {cat.subcategories?.map((child) => (
                <Button
                  key={child.id}
                  variant={currentCategory === child.slug ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start pl-8 text-sm"
                  onClick={() => updateFilter("category", child.slug)}
                >
                  {child.name}
                </Button>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Municipio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
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
