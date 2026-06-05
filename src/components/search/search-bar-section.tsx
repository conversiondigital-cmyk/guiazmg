"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SearchAutocomplete } from "@/components/search/search-autocomplete"
import { Button } from "@/components/ui/button"

interface SearchBarSectionProps {
  initialQuery?: string
}

export function SearchBarSection({ initialQuery = "" }: SearchBarSectionProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    const params = new URLSearchParams(window.location.search)
    params.set("q", searchQuery.trim())
    params.delete("page")
    router.push(`/search?${params.toString()}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <div className="relative flex-1">
              <SearchAutocomplete
                value={query}
                onChange={setQuery}
                onSubmit={handleSearch}
                placeholder="Buscar negocios, servicios, categorías..."
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="mr-1.5 rounded-lg bg-blue-600 px-5 text-white hover:bg-blue-700"
            >
              Buscar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
