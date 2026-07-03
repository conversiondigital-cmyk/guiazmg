"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Notif {
  id: string
  type: string
  title: string
  message: string | null
  isRead: boolean
  createdAt: string
}

// El modelo Notification no guarda un enlace; se navega según el tipo hacia la
// sección de admin correspondiente.
const DEST: Record<string, string> = {
  SYSTEM: "/admin/negocios",
  REVIEW: "/admin/reviews",
  PAYMENT: "/admin/pagos",
  EXPIRATION: "/admin/negocios",
  PROMOTION: "/admin/promociones",
  MESSAGE: "/admin",
}

export function AdminNotifications() {
  const router = useRouter()
  const [items, setItems] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/notifications?limit=10")
      if (r.ok) {
        const j = await r.json()
        setItems(j.data || [])
        setUnread(j.unreadCount || 0)
      }
    } catch {
      // silencioso: si falla, el bell queda sin badge
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const open = (n: Notif) => {
    if (!n.isRead) {
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: [n.id] }),
      }).catch(() => {})
      setUnread((u) => Math.max(0, u - 1))
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
    }
    router.push(DEST[n.type] ?? "/admin")
  }

  const markAll = async () => {
    setUnread(0)
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })))
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    }).catch(() => {})
  }

  return (
    <DropdownMenu onOpenChange={(o) => o && load()}>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <span className="text-sm font-semibold text-gray-900">Notificaciones</span>
          {unread > 0 && (
            <button onClick={markAll} className="text-xs font-medium text-green-700 hover:underline">
              Marcar todas leídas
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Cargando…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Sin notificaciones</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`flex w-full items-start gap-2 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 ${
                  n.isRead ? "" : "bg-green-50/60"
                }`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-green-600"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-gray-900">{n.title}</span>
                  {n.message && (
                    <span className="mt-0.5 block line-clamp-2 text-xs text-gray-500">{n.message}</span>
                  )}
                  <span className="mt-1 block text-[10px] text-gray-400">
                    {new Date(n.createdAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
