"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search, Filter, ChevronDown, ChevronRight, ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface AuditUser {
  id: string; name: string | null; email: string; image?: string | null
}

interface AuditLogEntry {
  id: string; actorUserId: string; action: string; entityType: string
  entityId: string | null; oldValue: string | null; newValue: string | null
  createdAt: string; actor: AuditUser
}

interface Pagination {
  page: number; limit: number; total: number; totalPages: number
}

interface AuditoriaClientProps {
  logs: AuditLogEntry[]
  users: AuditUser[]
  pagination: Pagination
  filters: {
    userId: string; entityType: string; action: string; dateFrom: string; dateTo: string; search: string
  }
}

function formatDiffValue(val: string | null): string {
  if (!val) return "—"
  try {
    const parsed = JSON.parse(val)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return val
  }
}

function DiffView({ oldVal, newVal }: { oldVal: string | null; newVal: string | null }) {
  const oldParsed = formatDiffValue(oldVal)
  const newParsed = formatDiffValue(newVal)

  if (oldParsed === "—" && newParsed === "—") {
    return <p className="text-xs italic text-muted-foreground">Sin datos</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Valor anterior</p>
        <pre className="max-h-40 overflow-auto rounded-md bg-red-50 p-2 text-xs text-red-800 dark:bg-red-950/30 dark:text-red-400">
          {oldParsed}
        </pre>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Valor nuevo</p>
        <pre className="max-h-40 overflow-auto rounded-md bg-green-50 p-2 text-xs text-green-800 dark:bg-green-950/30 dark:text-green-400">
          {newParsed}
        </pre>
      </div>
    </div>
  )
}

export function AuditoriaClient({ logs, users, pagination, filters: initialFilters }: AuditoriaClientProps) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filters, setFilters] = useState(initialFilters)
  const [showFilters, setShowFilters] = useState(false)

  function applyFilters() {
    const params = new URLSearchParams()
    if (filters.userId) params.set("userId", filters.userId)
    if (filters.entityType) params.set("entityType", filters.entityType)
    if (filters.action) params.set("action", filters.action)
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom)
    if (filters.dateTo) params.set("dateTo", filters.dateTo)
    if (filters.search) params.set("search", filters.search)
    if (pagination.page > 1) params.set("page", "1")
    router.push(`/admin/auditoria?${params.toString()}`)
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(window.location.search)
    params.set("page", String(page))
    router.push(`/admin/auditoria?${params.toString()}`)
  }

  const entityTypes = [...new Set(logs.map((l) => l.entityType))].sort()

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Auditoría</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pagination.total} registro{pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="size-4" />
          Filtros
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Search className="size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID de entidad..."
          className="max-w-xs"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
        />
        <Button variant="secondary" size="sm" onClick={applyFilters}>
          Buscar
        </Button>
      </div>

      {showFilters && (
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Usuario</label>
            <Select
              value={filters.userId}
              onValueChange={(v) => setFilters((f) => ({ ...f, userId: v ?? "" }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Entidad</label>
            <Select
              value={filters.entityType}
              onValueChange={(v) => setFilters((f) => ({ ...f, entityType: v ?? "" }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {entityTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Acción</label>
            <Input
              placeholder="Ej: UPDATE, CREATE..."
              value={filters.action}
              onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Desde</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Hasta</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            />
          </div>
          <div className="col-span-full flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              setFilters({ userId: "", entityType: "", action: "", dateFrom: "", dateTo: "", search: "" })
              router.push("/admin/auditoria")
            }}>
              Limpiar
            </Button>
            <Button size="sm" onClick={applyFilters}>Aplicar</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Fecha</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Usuario</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Acción</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Entidad</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">ID</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Cambio</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              // @ts-ignore Fragment with key
              <React.Fragment key={log.id}>
                <tr
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("es-MX")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{log.actor.name || log.actor.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{log.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{log.entityType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {log.entityId ? (
                      <span className="max-w-[120px] truncate block">{log.entityId}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {expandedId === log.id ? (
                        <ChevronDown className="size-3.5" />
                      ) : (
                        <ChevronRight className="size-3.5" />
                      )}
                      Ver detalle
                    </div>
                  </td>
                </tr>
                {expandedId === log.id && (
                  <tr>
                    <td colSpan={6} className="bg-muted/30 p-4">
                      <DiffView oldVal={log.oldValue} newVal={log.newValue} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No se encontraron registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => goToPage(pagination.page - 1)}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => goToPage(pagination.page + 1)}
          >
            Siguiente
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
