"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { AdminFilter, TableState } from "./admin-types"
import { PAGINATION_DEFAULTS } from "./admin-constants"

// ============================================================================
// useAdminTable - Manage table state (pagination, sorting, filtering)
// ============================================================================

export function useAdminTable(initialFilters?: Record<string, unknown>) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tableState, setTableState] = useState<TableState>({
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || String(PAGINATION_DEFAULTS.LIMIT)),
    sortBy: searchParams.get("sortBy") || undefined,
    sortDir: (searchParams.get("sortDir") as "asc" | "desc") || "asc",
    filters: initialFilters || {},
  })

  // Persist filters to URL on change
  useEffect(() => {
    const params = new URLSearchParams()
    params.set("page", String(tableState.page))
    params.set("limit", String(tableState.limit))
    if (tableState.sortBy) params.set("sortBy", tableState.sortBy)
    if (tableState.sortDir) params.set("sortDir", tableState.sortDir)

    // Add filter params
    Object.entries(tableState.filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        params.set(`f_${key}`, String(value))
      }
    })

    router.push(`?${params.toString()}`, { scroll: false })
  }, [tableState, router])

  const handlePageChange = useCallback((page: number) => {
    setTableState((prev) => ({ ...prev, page }))
  }, [])

  const handleLimitChange = useCallback((limit: number) => {
    setTableState((prev) => ({ ...prev, page: 1, limit }))
  }, [])

  const handleSort = useCallback((column: string) => {
    setTableState((prev) => ({
      ...prev,
      sortBy: column,
      sortDir: prev.sortBy === column && prev.sortDir === "asc" ? "desc" : "asc",
      page: 1,
    }))
  }, [])

  const handleFilterChange = useCallback((filters: Record<string, unknown>) => {
    setTableState((prev) => ({
      ...prev,
      filters,
      page: 1,
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setTableState((prev) => ({
      ...prev,
      filters: initialFilters || {},
      page: 1,
    }))
  }, [initialFilters])

  return {
    ...tableState,
    handlePageChange,
    handleLimitChange,
    handleSort,
    handleFilterChange,
    resetFilters,
  }
}

// ============================================================================
// useAdminFilters - Build Prisma where clause from UI filters
// ============================================================================

interface FilterBuilder {
  text?: (key: string, value: string) => Record<string, unknown>
  select?: (key: string, value: string) => Record<string, unknown>
  multiSelect?: (key: string, values: string[]) => Record<string, unknown>
  dateRange?: (key: string, start: Date, end: Date) => Record<string, unknown>
}

export function useAdminFilters(filters: Record<string, unknown>, builder?: FilterBuilder) {
  return useMemo(() => {
    const whereClause: Record<string, unknown> = {}

    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return

      if (Array.isArray(value)) {
        if (builder?.multiSelect) {
          Object.assign(whereClause, builder.multiSelect(key, value as string[]))
        }
      } else if (typeof value === "string") {
        if (builder?.select) {
          Object.assign(whereClause, builder.select(key, value))
        } else if (builder?.text) {
          Object.assign(whereClause, builder.text(key, value))
        }
      } else if (value instanceof Date) {
        // Handle date filters if needed
      }
    })

    return whereClause
  }, [filters, builder])
}

// ============================================================================
// useBulkAction - Handle bulk operations with loading/error states
// ============================================================================

export interface UseBulkActionOptions {
  onSuccess?: (result: unknown) => void
  onError?: (error: Error) => void
}

export function useBulkAction(url: string, options?: UseBulkActionOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(
    async (entityIds: string[], action: string, params?: Record<string, unknown>) => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityIds, action, params }),
        })

        if (!response.ok) {
          throw new Error(`Bulk action failed: ${response.statusText}`)
        }

        const result = await response.json()
        options?.onSuccess?.(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        setError(error)
        options?.onError?.(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [url, options]
  )

  return { execute, loading, error }
}

// ============================================================================
// useAdminDialog - Manage dialog visibility and actions
// ============================================================================

export interface DialogState {
  isOpen: boolean
  data?: unknown
  action?: string
}

export function useAdminDialog() {
  const [state, setState] = useState<DialogState>({ isOpen: false })

  const open = useCallback((action: string, data?: unknown) => {
    setState({ isOpen: true, action, data })
  }, [])

  const close = useCallback(() => {
    setState({ isOpen: false, data: undefined, action: undefined })
  }, [])

  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }))
  }, [])

  return { ...state, open, close, toggle }
}

// ============================================================================
// useAdminSelection - Manage multi-select state for bulk actions
// ============================================================================

export function useAdminSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)))
    }
  }, [items, selectedIds.size])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selected = useMemo(() => items.filter((item) => selectedIds.has(item.id)), [items, selectedIds])

  return {
    selectedIds,
    selected,
    isAllSelected: selectedIds.size === items.length,
    isPartiallySelected: selectedIds.size > 0 && selectedIds.size < items.length,
    toggleItem,
    toggleAll,
    clearSelection,
    selectCount: selectedIds.size,
  }
}

// ============================================================================
// useAdminAsync - Fetch data with loading/error states
// ============================================================================

interface UseAdminAsyncOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useAdminAsync<T>(
  fetchFn: () => Promise<T>,
  dependencies: unknown[] = [],
  options?: UseAdminAsyncOptions<T>
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetchFn()
      setData(result)
      options?.onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      options?.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, options])

  useEffect(() => {
    refetch()
  }, [refetch, ...dependencies])

  return { data, loading, error, refetch }
}

// ============================================================================
// useAdminForm - Form submission with loading/error states
// ============================================================================

export interface FormSubmitOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  resetOnSuccess?: boolean
}

export function useAdminForm<T extends Record<string, unknown>>(
  onSubmit: (data: T) => Promise<void>,
  options?: FormSubmitOptions
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const handleSubmit = useCallback(
    async (data: T) => {
      setLoading(true)
      setError(null)

      try {
        await onSubmit(data)
        options?.onSuccess?.()
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        setError(error)
        options?.onError?.(error)
      } finally {
        setLoading(false)
      }
    },
    [onSubmit, options]
  )

  const clearError = useCallback(() => setError(null), [])

  return { handleSubmit, loading, error, clearError }
}

// ============================================================================
// useAdminDebounce - Debounce search/filter input
// ============================================================================

export function useAdminDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// ============================================================================
// useAdminToast - Simple toast notification management
// ============================================================================

export interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info" | "warning"
  duration?: number
}

export function useAdminToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const add = useCallback((message: string, type: Toast["type"] = "info", duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast: Toast = { id, message, type, duration }

    setToasts((prev) => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }, [])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    return add(message, "success", duration)
  }, [add])

  const error = useCallback((message: string, duration?: number) => {
    return add(message, "error", duration)
  }, [add])

  const info = useCallback((message: string, duration?: number) => {
    return add(message, "info", duration)
  }, [add])

  const warning = useCallback((message: string, duration?: number) => {
    return add(message, "warning", duration)
  }, [add])

  return { toasts, add, remove, success, error, info, warning }
}
