"use client"

import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface ColumnMeta {
  headerClassName?: string
  cellClassName?: string
}

interface DataTableProps<TData extends { id: string }, TValue> {
  columns: (ColumnDef<TData, TValue> & { meta?: ColumnMeta })[]
  data: TData[]
  loading?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
  }
  onPaginationChange?: (page: number) => void
  onRowSelect?: (rows: TData[]) => void
  selectable?: boolean
  emptyMessage?: string
}

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  loading = false,
  pagination,
  onPaginationChange,
  onRowSelect,
  selectable = false,
  emptyMessage = "No hay datos disponibles",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    manualPagination: !!pagination,
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map((row) => row.id))
      setSelectedRows(allIds)
      onRowSelect?.(data)
    } else {
      setSelectedRows(new Set())
      onRowSelect?.([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRows(newSelected)

    const selectedData = data.filter((row) => newSelected.has(row.id))
    onRowSelect?.(selectedData)
  }

  const allSelected = data.length > 0 && selectedRows.size === data.length
  const someSelected = selectedRows.size > 0 && selectedRows.size < data.length

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected || someSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
                </TableHead>
              )}
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-semibold text-gray-700 text-xs uppercase tracking-wider"
                    style={{
                      width: header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center justify-between gap-2",
                          header.column.getCanSort() && "cursor-pointer select-none"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>

                        {header.column.getCanSort() && (
                          <div className="w-4 h-4 flex items-center justify-center text-gray-400">
                            {header.column.getIsSorted() === "desc" && <ChevronDown className="w-4 h-4" />}
                            {header.column.getIsSorted() === "asc" && <ChevronUp className="w-4 h-4" />}
                            {!header.column.getIsSorted() && <ChevronsUpDown className="w-4 h-4 opacity-50" />}
                          </div>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row, index) => (
              <TableRow
                key={row.id}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                )}
              >
                {selectable && (
                  <TableCell className="w-12">
                    <Checkbox
                      checked={selectedRows.has(row.original.id)}
                      onCheckedChange={(checked) => handleSelectRow(row.original.id, !!checked)}
                      aria-label={`Select row ${row.original.id}`}
                    />
                  </TableCell>
                )}
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="text-sm py-3.5 px-4"
                    style={{
                      width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {pagination && (
        <div className="flex items-center justify-between py-4 px-2">
          <div className="text-sm text-gray-600">
            Mostrando{" "}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{" "}
            a{" "}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            de <span className="font-medium">{pagination.total}</span> resultados
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaginationChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Anterior
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }).map(
                (_, i) => {
                  const pageNum = i + 1
                  const isNearCurrent = Math.abs(pageNum - pagination.page) <= 2
                  const isFirst = pageNum === 1
                  const isLast = pageNum === Math.ceil(pagination.total / pagination.limit)

                  if (!isFirst && !isLast && !isNearCurrent) {
                    if (pageNum === 2 && pagination.page > 3) {
                      return (
                        <span key={pageNum} className="text-gray-400 px-1">
                          ...
                        </span>
                      )
                    }
                    if (pageNum === Math.ceil(pagination.total / pagination.limit) - 1 && pagination.page < pageNum - 2) {
                      return (
                        <span key={pageNum} className="text-gray-400 px-1">
                          ...
                        </span>
                      )
                    }
                    return null
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPaginationChange?.(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                }
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaginationChange?.(pagination.page + 1)}
              disabled={pagination.page * pagination.limit >= pagination.total}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
