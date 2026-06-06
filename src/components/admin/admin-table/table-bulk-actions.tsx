"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export interface BulkAction {
  label: string
  value: string
  icon?: React.ReactNode
  variant?: "default" | "destructive"
  onClick: (selectedIds: string[]) => void | Promise<void>
}

interface TableBulkActionsProps {
  selectedIds: string[]
  actions: BulkAction[]
  loading?: boolean
  onClearSelection: () => void
}

export function TableBulkActions({
  selectedIds,
  actions,
  loading = false,
  onClearSelection,
}: TableBulkActionsProps) {
  if (selectedIds.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between shadow-lg z-40">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          {selectedIds.length} elemento{selectedIds.length === 1 ? "" : "s"} seleccionado
          {selectedIds.length === 1 ? "" : "s"}
        </span>

        <div className="flex gap-2">
          {actions.map((action) => (
            <Button
              key={action.value}
              variant={action.variant === "destructive" ? "destructive" : "outline"}
              size="sm"
              onClick={() => action.onClick(selectedIds)}
              disabled={loading}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <button
        onClick={onClearSelection}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Deseleccionar todo"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

// Alternative: Dropdown-based bulk actions
interface TableBulkActionsDropdownProps {
  selectedIds: string[]
  actions: BulkAction[]
  loading?: boolean
  onClearSelection: () => void
}

export function TableBulkActionsDropdown({
  selectedIds,
  actions,
  loading = false,
  onClearSelection,
}: TableBulkActionsDropdownProps) {
  if (selectedIds.length === 0) return null

  const destructiveActions = actions.filter((a) => a.variant === "destructive")
  const otherActions = actions.filter((a) => a.variant !== "destructive")

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
      <span className="text-sm font-medium text-blue-900">
        {selectedIds.length} seleccionado{selectedIds.length === 1 ? "" : "s"}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" disabled={loading}>
            Acciones ({actions.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {otherActions.map((action) => (
            <DropdownMenuItem
              key={action.value}
              onClick={() => action.onClick(selectedIds)}
              disabled={loading}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </DropdownMenuItem>
          ))}

          {destructiveActions.length > 0 && <DropdownMenuSeparator />}

          {destructiveActions.map((action) => (
            <DropdownMenuItem
              key={action.value}
              onClick={() => action.onClick(selectedIds)}
              disabled={loading}
              className="text-red-600"
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        onClick={onClearSelection}
        className="text-gray-400 hover:text-gray-600 transition-colors ml-auto"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
