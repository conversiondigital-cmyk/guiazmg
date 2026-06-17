"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Mail, Search, UserPlus, Shield, ShieldOff, LogIn, BookOpen, Loader2, X, CheckCircle } from "lucide-react"
import { confirmDialog } from "@/components/ui/system-dialog"

interface Editor {
  id: string
  name: string | null
  email: string
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
  _count: { posts: number }
  publishedCount: number
  pendingCount: number
}

interface EditoresClientProps {
  editors: Editor[]
}

function fmt(d: string | null) {
  if (!d) return "Nunca"
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "2-digit" }).format(new Date(d))
}

export function EditoresClient({ editors: initial }: EditoresClientProps) {
  const router = useRouter()
  const [editors, setEditors] = useState(initial)
  const [, startTransition] = useTransition()

  // Promote modal state
  const [promoteOpen, setPromoteOpen] = useState(false)
  const [searchQ, setSearchQ]         = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching]     = useState(false)
  const [promoting, setPromoting]     = useState<string | null>(null)
  const [feedback, setFeedback]       = useState("")

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Search users to promote
  const searchUsers = async () => {
    if (!searchQ.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(searchQ)}&limit=10`)
      const data = await res.json()
      // Exclude existing editors
      const editorIds = new Set(editors.map((e) => e.id))
      setSearchResults((data.users ?? []).filter((u: any) => !editorIds.has(u.id) && u.role !== "ADMIN"))
    } finally {
      setSearching(false)
    }
  }

  const promoteUser = async (userId: string, userName: string) => {
    setPromoting(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "EDITOR" }),
      })
      if (res.ok) {
        setFeedback(`✅ ${userName ?? userId} ahora es Editor`)
        setSearchResults([])
        setSearchQ("")
        setPromoteOpen(false)
        startTransition(() => router.refresh())
      } else {
        setFeedback("❌ Error al promover usuario")
      }
    } finally {
      setPromoting(null)
    }
  }

  const revokeEditor = async (editorId: string, editorName: string) => {
    if (!(await confirmDialog({
      title: "Revocar rol de Editor",
      description: `¿Revocar rol de Editor a ${editorName ?? editorId}?`,
      confirmText: "Revocar",
      destructive: true,
    }))) return
    setActionLoading(editorId + "_revoke")
    try {
      const res = await fetch(`/api/admin/users/${editorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "USER" }),
      })
      if (res.ok) {
        setEditors((prev) => prev.filter((e) => e.id !== editorId))
        startTransition(() => router.refresh())
      }
    } finally {
      setActionLoading(null)
    }
  }

  const toggleActive = async (editorId: string, currentActive: boolean) => {
    setActionLoading(editorId + "_toggle")
    try {
      const res = await fetch(`/api/admin/users/${editorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (res.ok) {
        setEditors((prev) =>
          prev.map((e) => e.id === editorId ? { ...e, isActive: !currentActive } : e)
        )
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <>
      {/* Feedback toast */}
      {feedback && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {feedback}
          <button onClick={() => setFeedback("")} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Promote modal */}
      {promoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-bold text-gray-900">Promover usuario a Editor</h2>
              <button onClick={() => { setPromoteOpen(false); setSearchResults([]); setSearchQ("") }}>
                <X className="h-4 w-4 text-gray-400 hover:text-gray-700" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-500">Busca un usuario por nombre o email para asignarle el rol de Editor.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre o email..."
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <button
                  onClick={searchUsers}
                  disabled={searching || !searchQ.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Buscar
                </button>
              </div>

              {searchResults.length > 0 ? (
                <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  {searchResults.map((u) => (
                    <div key={u.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{u.name ?? "Sin nombre"}</p>
                        <p className="text-xs text-gray-400">{u.email} · Rol: {u.role}</p>
                      </div>
                      <button
                        onClick={() => promoteUser(u.id, u.name ?? u.email)}
                        disabled={promoting === u.id}
                        className="flex items-center gap-1.5 rounded-lg bg-green-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-900 disabled:opacity-50"
                      >
                        {promoting === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                        Promover
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQ && !searching ? (
                <p className="text-sm text-center text-gray-400 py-4">Sin resultados para "{searchQ}"</p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Editors table */}
      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Editores activos ({editors.length})</p>
          <button
            onClick={() => setPromoteOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Agregar editor
          </button>
        </div>

        {editors.length === 0 ? (
          <div className="py-16 text-center">
            <Shield className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No hay editores registrados</p>
            <button
              onClick={() => setPromoteOpen(true)}
              className="mt-4 text-sm font-semibold text-green-700 hover:underline"
            >
              Agrega el primero →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Editor</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500 hidden md:table-cell">Posts</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500 hidden md:table-cell">Publicados</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500 hidden lg:table-cell">Pendientes</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden lg:table-cell">Último acceso</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {editors.map((editor) => (
                  <tr key={editor.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                          {(editor.name ?? editor.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{editor.name ?? "—"}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail className="h-2.5 w-2.5" /> {editor.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1 text-gray-600">
                        <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-semibold">{editor._count.posts}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center hidden md:table-cell">
                      <span className="font-semibold text-green-700">{editor.publishedCount}</span>
                    </td>
                    <td className="px-4 py-4 text-center hidden lg:table-cell">
                      {editor.pendingCount > 0
                        ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{editor.pendingCount}</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <LogIn className="h-3 w-3" />
                        {fmt(editor.lastLoginAt)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${editor.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {editor.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleActive(editor.id, editor.isActive)}
                          disabled={actionLoading === editor.id + "_toggle"}
                          title={editor.isActive ? "Desactivar" : "Activar"}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                            editor.isActive
                              ? "text-gray-400 hover:bg-red-50 hover:text-red-600"
                              : "text-gray-400 hover:bg-green-50 hover:text-green-700"
                          }`}
                        >
                          {actionLoading === editor.id + "_toggle"
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : editor.isActive ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />
                          }
                        </button>
                        <button
                          onClick={() => revokeEditor(editor.id, editor.name ?? editor.email)}
                          disabled={actionLoading === editor.id + "_revoke"}
                          title="Revocar rol de Editor"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          {actionLoading === editor.id + "_revoke"
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <X className="h-3.5 w-3.5" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
