"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Clock, TrendingUp, Loader2 } from "@/lib/icons"

interface SearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder = "ej. cerrajero parque real, dentista chapalita, tacos cerca de mí...",
  autoFocus = false,
  className = "",
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [popular, setPopular] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    fetch("/api/search/popular")
      .then((r) => r.json())
      .then((data) => setPopular(data.map((d: any) => d.query)))
      .catch(() => {})
  }, [])

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      setIsOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setSuggestions(data)
      setIsOpen(true)
      setHighlightedIndex(-1)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 150)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < (suggestions.length || popular.length) - 1 ? prev + 1 : 0
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlightedIndex >= 0) {
        const selected = suggestions[highlightedIndex] || popular[highlightedIndex]
        if (selected) {
          onChange(selected)
          onSubmit(selected)
        }
      } else {
        onSubmit(value)
      }
      setIsOpen(false)
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (suggestion: string) => {
    onChange(suggestion)
    onSubmit(suggestion)
    setIsOpen(false)
  }

  const showSuggestions = isOpen && (suggestions.length > 0 || (popular.length > 0 && !value.trim()))

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 || (!value.trim() && popular.length > 0)) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border-0 bg-transparent py-3.5 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
      </div>

      {showSuggestions && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl">
          {suggestions.length > 0 ? (
            <ul>
              {suggestions.map((s, i) => (
                <li
                  key={s}
                  onClick={() => handleSelect(s)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    i === highlightedIndex ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                  } ${i === 0 ? "rounded-t-xl" : ""} ${i === suggestions.length - 1 ? "rounded-b-xl" : ""}`}
                >
                  <Search className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <TrendingUp className="h-3 w-3" />
                Búsquedas populares
              </div>
              <ul>
                {popular.map((s, i) => (
                  <li
                    key={s}
                    onClick={() => handleSelect(s)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                      i === highlightedIndex ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                    } ${i === popular.length - 1 ? "rounded-b-xl" : ""}`}
                  >
                    <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
