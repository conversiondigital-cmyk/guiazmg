"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search } from "@/lib/icons"
import type { LucideIcon } from "@/lib/icons"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; href: string }
  suggestion?: string
}

export function EmptyState({ icon: Icon, title, description, action, suggestion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {Icon && (
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 text-center max-w-md mb-4">{description}</p>}
      {suggestion && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Search className="h-4 w-4" />
          <span>¿Buscabas &quot;{suggestion}&quot;?</span>
        </div>
      )}
      {action && (
        <Button asChild variant="outline">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  )
}
