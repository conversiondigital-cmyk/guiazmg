"use client"

import { TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  loading?: boolean
  onClick?: () => void
  className?: string
}

export function MetricCard({
  title,
  value,
  unit,
  icon,
  trend,
  loading = false,
  onClick,
  className,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className={cn(
        "p-6 rounded-lg border border-gray-200 bg-white",
        className
      )}>
        <div className="space-y-4">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-6 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
        </div>

        {icon && (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center text-green-600">
            {icon}
          </div>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium",
            trend.isPositive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          )}>
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
          <span className="text-xs text-gray-600">{trend.label}</span>
        </div>
      )}
    </div>
  )
}

// Grid layout for multiple metrics
interface MetricGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
}

export function MetricGrid({ children, columns = 4 }: MetricGridProps) {
  return (
    <div className={cn(
      "grid gap-4",
      {
        "grid-cols-1": columns === 1,
        "grid-cols-1 sm:grid-cols-2": columns === 2,
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3": columns === 3,
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4": columns === 4,
      }
    )}>
      {children}
    </div>
  )
}
