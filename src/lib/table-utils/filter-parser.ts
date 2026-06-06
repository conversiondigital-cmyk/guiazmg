import type { AdminFilter } from "../admin-types"

// ============================================================================
// Filter Parser - Convert UI filters to Prisma where clause
// ============================================================================

/**
 * Parse filter configuration and values into a Prisma-compatible where clause.
 *
 * @param filters - The filter definitions
 * @param values - The current filter values
 * @returns Prisma where clause object
 *
 * @example
 * const where = parseFilters(
 *   [
 *     { type: 'text', key: 'email', label: 'Email' },
 *     { type: 'select', key: 'role', label: 'Role', options: [...] }
 *   ],
 *   { email: 'john@example.com', role: 'ADMIN' }
 * )
 * // Returns: { email: { contains: 'john@example.com', mode: 'insensitive' }, role: 'ADMIN' }
 */
export function parseFilters(
  filters: AdminFilter[],
  values: Record<string, unknown>
): Record<string, unknown> {
  const where: Record<string, unknown> = {}

  filters.forEach((filter) => {
    const value = values[filter.key]

    if (value === null || value === undefined || value === "") {
      return // Skip empty filters
    }

    switch (filter.type) {
      case "text":
        where[filter.key] = {
          contains: String(value),
          mode: "insensitive",
        }
        break

      case "select":
        where[filter.key] = value
        break

      case "multi-select":
        if (Array.isArray(value) && value.length > 0) {
          where[filter.key] = {
            in: value as string[],
          }
        }
        break

      case "status":
        // Status typically maps to a specific field, often boolean or enum
        if (value === "active" || value === "true") {
          where.isActive = true
        } else if (value === "inactive" || value === "false") {
          where.isActive = false
        } else {
          // Handle enum statuses
          where.status = value
        }
        break

      case "date-range":
        // Expects value as { from: Date, to: Date } or { from: string, to: string }
        if (typeof value === "object" && value !== null) {
          const range = value as Record<string, unknown>
          const conditions: Record<string, unknown> = {}

          if (range.from) {
            conditions.gte = new Date(String(range.from))
          }
          if (range.to) {
            conditions.lte = new Date(String(range.to))
          }

          if (Object.keys(conditions).length > 0) {
            where[filter.key] = conditions
          }
        }
        break

      case "number-range":
        // Expects value as { min: number, max: number }
        if (typeof value === "object" && value !== null) {
          const range = value as Record<string, unknown>
          const conditions: Record<string, unknown> = {}

          if (typeof range.min === "number") {
            conditions.gte = range.min
          }
          if (typeof range.max === "number") {
            conditions.lte = range.max
          }

          if (Object.keys(conditions).length > 0) {
            where[filter.key] = conditions
          }
        }
        break
    }
  })

  return where
}

// ============================================================================
// Advanced Filter Helpers
// ============================================================================

/**
 * Build a text search clause that searches multiple fields
 */
export function buildTextSearch(query: string, fields: string[]): Record<string, unknown> {
  if (!query.trim()) {
    return {}
  }

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: query,
        mode: "insensitive",
      },
    })),
  }
}

/**
 * Build a date range filter
 */
export function buildDateRange(
  field: string,
  from: Date | null,
  to: Date | null
): Record<string, unknown> {
  if (!from && !to) {
    return {}
  }

  const conditions: Record<string, unknown> = {}

  if (from) {
    conditions.gte = from
  }
  if (to) {
    conditions.lte = to
  }

  return { [field]: conditions }
}

/**
 * Build a numeric range filter
 */
export function buildNumberRange(
  field: string,
  min: number | null,
  max: number | null
): Record<string, unknown> {
  if (min === null && max === null) {
    return {}
  }

  const conditions: Record<string, unknown> = {}

  if (min !== null) {
    conditions.gte = min
  }
  if (max !== null) {
    conditions.lte = max
  }

  return { [field]: conditions }
}

/**
 * Build a NOT condition for exclusion filters
 */
export function buildExclusionFilter(field: string, value: unknown): Record<string, unknown> {
  if (!value) {
    return {}
  }

  return {
    NOT: {
      [field]: value,
    },
  }
}

/**
 * Build a relationship filter (e.g., filter by userId)
 */
export function buildRelationshipFilter(field: string, relationField: string, value: unknown): Record<string, unknown> {
  if (!value) {
    return {}
  }

  return {
    [field]: {
      [relationField]: value,
    },
  }
}

/**
 * Combine multiple where clauses with AND logic
 */
export function combineFilters(...whereObjects: Record<string, unknown>[]): Record<string, unknown> {
  const validObjects = whereObjects.filter((obj) => Object.keys(obj).length > 0)

  if (validObjects.length === 0) {
    return {}
  }

  if (validObjects.length === 1) {
    return validObjects[0]
  }

  return {
    AND: validObjects,
  }
}

/**
 * Combine multiple where clauses with OR logic
 */
export function combineFiltersOr(...whereObjects: Record<string, unknown>[]): Record<string, unknown> {
  const validObjects = whereObjects.filter((obj) => Object.keys(obj).length > 0)

  if (validObjects.length === 0) {
    return {}
  }

  if (validObjects.length === 1) {
    return validObjects[0]
  }

  return {
    OR: validObjects,
  }
}

// ============================================================================
// Special Filters
// ============================================================================

/**
 * Build soft-delete filter (exclude deleted items by default)
 */
export function buildActivFilter(includeDeleted = false): Record<string, unknown> {
  if (includeDeleted) {
    return {}
  }

  return {
    deletedAt: null,
  }
}

/**
 * Build status filter for common status patterns
 */
export function buildStatusFilter(
  field: string,
  statuses: string[] | string
): Record<string, unknown> {
  if (!statuses) {
    return {}
  }

  const statusArray = Array.isArray(statuses) ? statuses : [statuses]

  if (statusArray.length === 1) {
    return { [field]: statusArray[0] }
  }

  return { [field]: { in: statusArray } }
}

/**
 * Build verification filter (verified/unverified)
 */
export function buildVerificationFilter(field = "verifiedAt", isVerified: boolean): Record<string, unknown> {
  if (isVerified) {
    return {
      [field]: { not: null },
    }
  }

  return {
    [field]: null,
  }
}

/**
 * Build pagination params
 */
export interface PaginationParams {
  skip: number
  take: number
}

export function buildPaginationParams(page: number, limit: number): PaginationParams {
  const skip = Math.max(0, (page - 1) * limit)
  return { skip, take: limit }
}

/**
 * Build sorting params
 */
export interface SortParams {
  orderBy: Record<string, "asc" | "desc">
}

export function buildSortParams(sortBy: string | null, sortDir: "asc" | "desc" = "asc"): SortParams {
  if (!sortBy) {
    return { orderBy: { createdAt: "desc" } } // Default sort
  }

  return {
    orderBy: { [sortBy]: sortDir },
  }
}

// ============================================================================
// Filter Serialization (for URL parameters and state persistence)
// ============================================================================

/**
 * Serialize filter values to URL-safe string
 */
export function serializeFilters(filters: Record<string, unknown>): string {
  return JSON.stringify(filters)
}

/**
 * Deserialize filter values from URL-safe string
 */
export function deserializeFilters(serialized: string): Record<string, unknown> {
  try {
    return JSON.parse(serialized)
  } catch {
    return {}
  }
}

// ============================================================================
// Export all utilities as a single object for convenience
// ============================================================================

export const filterUtils = {
  parseFilters,
  buildTextSearch,
  buildDateRange,
  buildNumberRange,
  buildExclusionFilter,
  buildRelationshipFilter,
  combineFilters,
  combineFiltersOr,
  buildActivFilter,
  buildStatusFilter,
  buildVerificationFilter,
  buildPaginationParams,
  buildSortParams,
  serializeFilters,
  deserializeFilters,
}
