"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MoreHorizontal, Eye, Edit3, Shield, UserCheck, UserX } from "@/lib/icons"

type UserRow = {
  id: string
  name: string | null
  email: string
  role: string
  isActive: boolean
}

const ROLES = ["USER", "BUSINESS_OWNER", "EDITOR", "SALES_AGENT", "ADMIN"]
const ROLE_LABELS: Record<string, string> = {
  USER: "Usuario",
  BUSINESS_OWNER: "Dueño",
  EDITOR: "Editor",
  SALES_AGENT: "Agente",
  ADMIN: "Administrador",
}

export function UserActions({ user }: { user: UserRow }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [name, setName] = useState(user.name ?? "")
  const [role, setRole] = useState(user.role)
  const [saving, setSaving] = useState(false)

  async function patch(data: Record<string, unknown>, successMsg: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "No se pudo completar la acción")
      }
      toast.success(successMsg)
      setEditOpen(false)
      setRoleOpen(false)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error inesperado")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/admin/usuarios/${user.id}`} />}>
            <Eye className="mr-2 h-4 w-4" />
            Ver
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setName(user.name ?? "")
              setEditOpen(true)
            }}
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          {user.isActive ? (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => patch({ isActive: false }, "Usuario suspendido")}
            >
              <UserX className="mr-2 h-4 w-4" />
              Suspender
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => patch({ isActive: true }, "Usuario reactivado")}>
              <UserCheck className="mr-2 h-4 w-4" />
              Reactivar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => {
              setRole(user.role)
              setRoleOpen(true)
            }}
          >
            <Shield className="mr-2 h-4 w-4" />
            Cambiar Rol
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="user-name">Nombre</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del usuario"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={saving || name.trim().length < 2}
              onClick={() => patch({ name }, "Usuario actualizado")}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar rol</DialogTitle>
            <DialogDescription>{user.name ?? user.email}</DialogDescription>
          </DialogHeader>
          <Select value={role} onValueChange={(value) => setRole(value ?? user.role)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={saving || role === user.role}
              onClick={() => patch({ role }, "Rol actualizado")}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
