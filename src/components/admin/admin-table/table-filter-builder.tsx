"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AdminFilter } from "@/lib/admin-types"

interface TableFilterBuilderProps {
  filters: AdminFilter[]
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  onReset?: () => void
}

export function TableFilterBuilder({
  filters,
  values,
  onChange,
  onReset,
}: TableFilterBuilderProps) {
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set())

  const toggleFilter = (key: string) => {
    const next = new Set(expandedFilters)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    setExpandedFilters(next)
  }

  const handleTextChange = (key: string, value: string) => {
    onChange({ ...values, [key]: value || null })
  }

  const handleSelectChange = (key: string, value: string | null) => {
    onChange({ ...values, [key]: value || null })
  }

  const handleMultiSelectChange = (key: string, value: string, checked: boolean) => {
    const current = Array.isArray(values[key]) ? values[key] : []
    const next = checked
      ? [...(current as string[]), value]
      : (current as string[]).filter((v) => v !== value)

    onChange({ ...values, [key]: next.length > 0 ? next : null })
  }

  const handleDateRangeChange = (key: string, field: "from" | "to", value: string) => {
    const current = values[key] || {}
    onChange({
      ...values,
      [key]: {
        ...(typeof current === "object" && current !== null ? (current as Record<string, unknown>) : {}),
        [field]: value || null,
      },
    })
  }

  const activeFiltersCount = Object.values(values).filter((v) => v !== null && v !== undefined && v !== "").length

  return (
    <div className="space-y-4">
      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 items-center">
        {filters.map((filter) => {
          const value = values[filter.key]
          const isActive = value !== null && value !== undefined && value !== ""

          return (
            <button
              key={filter.key}
              onClick={() => toggleFilter(filter.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              {filter.label}
              {isActive && activeFiltersCount > 0 && (
                <span className="ml-2 font-bold">✓</span>
              )}
            </button>
          )
        })}

        {activeFiltersCount > 0 && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-gray-600 hover:text-gray-900"
          >
            Limpiar todo
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {expandedFilters.size > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
          {filters.map((filter) => {
            if (!expandedFilters.has(filter.key)) return null

            return (
              <div key={filter.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-sm text-gray-700">
                    {filter.label}
                  </label>
                  <button
                    onClick={() => toggleFilter(filter.key)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Text Input */}
                {filter.type === "text" && (
                  <Input
                    type="text"
                    placeholder={filter.placeholder || `Buscar ${filter.label.toLowerCase()}...`}
                    value={(values[filter.key] as string) || ""}
                    onChange={(e) => handleTextChange(filter.key, e.target.value)}
                    className="bg-white"
                  />
                )}

                {/* Select Dropdown */}
                {filter.type === "select" && (
                  <Select
                    value={String((values[filter.key] ?? "") as string)}
                    onValueChange={(value) => handleSelectChange(filter.key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Selecciona ${filter.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options?.map((option) => (
                        <SelectItem key={option.value} value={String(option.value ?? "")}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Multi-Select Checkboxes */}
                {filter.type === "multi-select" && (
                  <div className="space-y-2">
                    {filter.options?.map((option) => {
                      const selected = (Array.isArray(values[filter.key]) ? (values[filter.key] as string[]) : []).includes(
                        String(option.value)
                      )
                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) =>
                              handleMultiSelectChange(
                                filter.key,
                                String(option.value),
                                e.target.checked
                              )
                            }
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {/* Date Range */}
                {filter.type === "date-range" && (
                  <div className="space-y-2">
                    <Input
                      type="date"
                      placeholder="Desde"
                      value={String(
                        (typeof values[filter.key] === "object" && values[filter.key] !== null
                          ? (values[filter.key] as Record<string, unknown>)?.from
                          : null) || ""
                      )}
                      onChange={(e) =>
                        handleDateRangeChange(filter.key, "from", e.target.value)
                      }
                      className="bg-white"
                    />
                    <Input
                      type="date"
                      placeholder="Hasta"
                      value={String(
                        (typeof values[filter.key] === "object" && values[filter.key] !== null
                          ? (values[filter.key] as Record<string, unknown>)?.to
                          : null) || ""
                      )}
                      onChange={(e) =>
                        handleDateRangeChange(filter.key, "to", e.target.value)
                      }
                      className="bg-white"
                    />
                  </div>
                )}

                {/* Status Filter */}
                {filter.type === "status" && (
                  <Select
                    value={String((values[filter.key] ?? "") as string)}
                    onValueChange={(value) => handleSelectChange(filter.key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                      {filter.options?.map((option) => (
                        <SelectItem key={option.value} value={String(option.value ?? "")}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* No Filters Message */}
      {filters.length === 0 && (
        <div className="text-sm text-gray-500 py-4 text-center">
          No hay filtros disponibles
        </div>
      )}
    </div>
  )
}
