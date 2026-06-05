"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { SEARCH_SUGGESTIONS } from "@/lib/constants"

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const filteredSuggestions = query
    ? SEARCH_SUGGESTIONS.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : SEARCH_SUGGESTIONS

  const handleSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim()
      if (!trimmed) return
      setShowSuggestions(false)
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    },
    [router]
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar negocios, servicios, profesionales..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch(query)
          }}
          className="pl-10 pr-10 h-10 bg-gray-50 border-gray-200 rounded-xl text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              inputRef.current?.focus()
            }}
            className="absolute right-3 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute top-full mt-2 w-full rounded-xl border bg-white shadow-lg z-50">
          <div className="p-2">
            {filteredSuggestions.slice(0, 8).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion)
                  handleSearch(suggestion)
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Search className="h-3.5 w-3.5 text-gray-400" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
