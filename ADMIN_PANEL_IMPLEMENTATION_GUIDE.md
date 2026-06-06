# Admin Panel Implementation Guide

## Quick Reference: Building Admin Pages

### Step 1: Define Filters & Columns

```typescript
// src/app/admin/usuarios/constants.ts
import { FILTER_OPTIONS } from "@/lib/admin-constants"
import type { AdminFilter } from "@/lib/admin-types"

export const USER_FILTERS: AdminFilter[] = [
  {
    type: "text",
    key: "email",
    label: "Email",
    placeholder: "buscar por email...",
  },
  {
    type: "select",
    key: "role",
    label: "Rol",
    options: FILTER_OPTIONS.userRoles,
  },
  {
    type: "status",
    key: "status",
    label: "Estado",
    options: [
      { value: "active", label: "Activo" },
      { value: "suspended", label: "Suspendido" },
    ],
  },
]

export const USER_COLUMNS: ColumnDef<AdminUser>[] = [
  {
    accessorKey: "email",
    header: "Email",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: (info) => {
      const role = info.getValue() as UserRole
      const colors = ROLE_COLORS[role]
      return (
        <Badge className={`${colors.bg} ${colors.text}`}>
          {ROLE_LABELS[role]}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: (info) => {
      const status = info.getValue() as UserStatus
      const colors = USER_STATUS_COLORS[status]
      return (
        <Badge className={`${colors.bg} ${colors.text}`}>
          {USER_STATUS_LABELS[status]}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: (info) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">Acciones</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEdit(info.row.original.id)}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSuspend(info.row.original.id)}>
            Suspender
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]
```

### Step 2: Create Page Component (Server)

```typescript
// src/app/admin/usuarios/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseFilters } from "@/lib/table-utils/filter-parser"
import { buildPaginationParams } from "@/lib/table-utils/filter-parser"
import { UsersClient } from "./users-client"
import { USER_FILTERS } from "./constants"

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  // Parse pagination
  const page = Math.max(1, parseInt(String(searchParams.page || "1")))
  const limit = Math.max(1, Math.min(100, parseInt(String(searchParams.limit || "20"))))

  // Build filter params
  const filters: Record<string, unknown> = {}
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key.startsWith("f_")) {
      const filterKey = key.slice(2)
      filters[filterKey] = value
    }
  })

  // Parse filters to Prisma where clause
  const where = parseFilters(USER_FILTERS, filters)

  // Fetch data
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      ...buildPaginationParams(page, limit),
    }),
    prisma.user.count({ where }),
  ])

  return (
    <UsersClient
      initialUsers={users}
      initialPagination={{ page, limit, total }}
      filters={filters}
    />
  )
}
```

### Step 3: Create Client Component

```typescript
// src/app/admin/usuarios/users-client.tsx
"use client"

import { useState } from "react"
import { useAdminTable, useBulkAction, useAdminSelection } from "@/lib/admin-hooks"
import { parseFilters } from "@/lib/table-utils/filter-parser"
import { 
  DataTable, 
  TableFilterBuilder, 
  TableBulkActions,
  ConfirmDialog 
} from "@/components/admin"
import { USER_FILTERS, USER_COLUMNS } from "./constants"

interface UsersClientProps {
  initialUsers: AdminUser[]
  initialPagination: { page: number; limit: number; total: number }
  filters: Record<string, unknown>
}

export function UsersClient({
  initialUsers,
  initialPagination,
  filters: initialFilters,
}: UsersClientProps) {
  const tableState = useAdminTable(initialFilters)
  const selection = useAdminSelection(initialUsers)
  const bulkAction = useBulkAction("/api/admin/users/bulk")
  
  const [loading, setLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: string
    ids: string[]
  }>({ open: false, action: "", ids: [] })

  const handleFilterChange = async (newFilters: Record<string, unknown>) => {
    tableState.handleFilterChange(newFilters)
    setLoading(true)
    
    try {
      const params = new URLSearchParams()
      params.set("page", "1")
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) params.set(`f_${key}`, String(value))
      })
      
      // Fetch updated data (would normally do a server call)
      // For now, rely on URL navigation
      window.location.search = params.toString()
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async (ids: string[], action: string) => {
    setConfirmDialog({ open: true, action, ids })
  }

  const confirmBulkAction = async () => {
    const { ids, action } = confirmDialog
    try {
      await bulkAction.execute(ids, action)
      selection.clearSelection()
      setConfirmDialog({ open: false, action: "", ids: [] })
      // Refetch data
      window.location.reload()
    } catch (error) {
      console.error("Bulk action failed:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-1">Gestiona usuarios y roles del sistema</p>
        </div>
        <Button href="/admin/usuarios/new">Crear usuario</Button>
      </div>

      <TableFilterBuilder
        filters={USER_FILTERS}
        values={tableState.filters}
        onChange={handleFilterChange}
        onReset={tableState.resetFilters}
      />

      <DataTable
        columns={USER_COLUMNS}
        data={initialUsers}
        loading={loading}
        selectable
        pagination={initialPagination}
        onRowSelect={(row) => selection.toggleItem(row.id)}
        onPaginationChange={tableState.handlePageChange}
      />

      <TableBulkActions
        selectedIds={Array.from(selection.selectedIds)}
        actions={[
          {
            label: "Cambiar rol a Admin",
            value: "promote-admin",
            onClick: (ids) => handleBulkAction(ids, "promote-admin"),
          },
          {
            label: "Suspender",
            value: "suspend",
            variant: "destructive",
            onClick: (ids) => handleBulkAction(ids, "suspend"),
          },
          {
            label: "Eliminar",
            value: "delete",
            variant: "destructive",
            onClick: (ids) => handleBulkAction(ids, "delete"),
          },
        ]}
        onClearSelection={selection.clearSelection}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title="Confirmar acción"
        description={`¿Confirmar ${confirmDialog.action} para ${confirmDialog.ids.length} usuario(s)?`}
        variant={confirmDialog.action === "delete" ? "destructive" : "default"}
        onConfirm={confirmBulkAction}
        onCancel={() => setConfirmDialog({ open: false, action: "", ids: [] })}
      />
    </div>
  )
}
```

### Step 4: Create API Endpoint (Bulk)

```typescript
// src/app/api/admin/users/bulk/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { entityIds, action, params } = await request.json()

    if (!entityIds?.length) {
      return NextResponse.json(
        { error: "No entities specified" },
        { status: 400 }
      )
    }

    let updated = 0
    let failed = 0

    switch (action) {
      case "suspend":
        const result = await prisma.user.updateMany({
          where: { id: { in: entityIds } },
          data: { isActive: false },
        })
        updated = result.count
        break

      case "delete":
        const deleteResult = await prisma.user.deleteMany({
          where: { id: { in: entityIds } },
        })
        updated = deleteResult.count
        break

      case "promote-admin":
        const promoteResult = await prisma.user.updateMany({
          where: { id: { in: entityIds } },
          data: { role: "ADMIN" },
        })
        updated = promoteResult.count
        break

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      updated,
      failed,
    })
  } catch (error) {
    console.error("Bulk action error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

---

## Checklist: Building a New Admin Page

- [ ] Create `constants.ts` with filters and columns
- [ ] Create `page.tsx` (server) that fetches data
- [ ] Create `*-client.tsx` (client) that renders table
- [ ] Create `/api/admin/[entity]/bulk/route.ts` for bulk actions
- [ ] Test filter persistence to URL
- [ ] Test table sorting and pagination
- [ ] Test bulk selection and actions
- [ ] Test confirmation dialogs

---

## Key Imports (Copy-Paste)

```typescript
// Hooks
import { 
  useAdminTable, 
  useBulkAction, 
  useAdminSelection 
} from "@/lib/admin-hooks"

// Utils
import { parseFilters, buildPaginationParams } from "@/lib/table-utils/filter-parser"

// Components
import { 
  DataTable, 
  TableFilterBuilder, 
  TableBulkActions,
  ConfirmDialog,
  FormField 
} from "@/components/admin"

// Constants
import { 
  ROLE_LABELS, 
  ROLE_COLORS, 
  USER_STATUS_LABELS, 
  USER_STATUS_COLORS,
  FILTER_OPTIONS 
} from "@/lib/admin-constants"

// Types
import type { AdminUser, AdminFilter, AdminTable } from "@/lib/admin-types"
```

---

## Color Quick Reference

```
Roles:
- ADMIN: red-100 / red-800
- EDITOR: yellow-100 / yellow-800
- SALES_AGENT: blue-100 / blue-800
- BUSINESS_OWNER: green-100 / green-800
- USER: gray-100 / gray-800

Status:
- active/approved: green-100 / green-800
- suspended/failed: red-100 / red-800
- pending/processing: yellow-100 / yellow-800
- deleted/inactive: gray-100 / gray-800

Header: bg-slate-900 (dark admin theme)
Sidebar: bg-slate-950
Table rows: Alternating white / gray-50/50
```

---

## Phase 2 Roadmap

**Week 1:**
- [ ] `/admin` dashboard with 4 metric cards
- [ ] 3 mini-charts (user growth, revenue, signups)
- [ ] `/admin/analytics` with date range picker

**Week 2:**
- [ ] `/admin/usuarios` (first full CRUD page)
- [ ] `/admin/usuarios/[id]` detail + edit page
- [ ] Bulk user actions (suspend, promote, delete)

**Week 3:**
- [ ] `/admin/negocios` (business profiles)
- [ ] `/admin/negocios/[id]` detail page
- [ ] Business filtering by status, plan, municipality

**Week 4:**
- [ ] `/admin/pagos` (payment transactions)
- [ ] `/admin/financiero` (revenue analytics)
- [ ] Month-over-month comparisons

Then repeat pattern for remaining 30+ pages.
