"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell,
  Star,
  MessageCircle,
  CreditCard,
  Clock,
  Megaphone,
  Check,
  ChevronRight,
} from "@/lib/icons"
import { timeAgo } from "@/lib/utils"

// El header monta el timbre en dos slots (escritorio y móvil). Se comparte la
// petición en vuelo y se cachea 5s para que ambos instancien una sola. Se precarga
// la LISTA (no solo el conteo) al montar → el menú abre al instante, sin esperar el
// fetch. Se invalida al marcar como leído.
let listInflight: Promise<{ list: Notification[]; count: number }> | null = null
let listCache: { at: number; list: Notification[]; count: number } | null = null
function fetchNotifications(): Promise<{ list: Notification[]; count: number }> {
  if (listInflight) return listInflight
  if (listCache && Date.now() - listCache.at < 5000) return Promise.resolve(listCache)
  listInflight = fetch("/api/notifications?unread=true&limit=5")
    .then((r) => r.json())
    .then((d) => {
      const res = { list: (d.data || []) as Notification[], count: d.unreadCount || 0 }
      listCache = { at: Date.now(), ...res }
      return res
    })
    .catch(() => ({ list: [] as Notification[], count: 0 }))
    .finally(() => {
      listInflight = null
    })
  return listInflight
}

const typeIcons: Record<string, typeof Bell> = {
  REVIEW: Star,
  MESSAGE: MessageCircle,
  PAYMENT: CreditCard,
  EXPIRATION: Clock,
  PROMOTION: Megaphone,
  SYSTEM: Bell,
}

const typeColors: Record<string, string> = {
  REVIEW: "bg-yellow-100 text-yellow-600",
  MESSAGE: "bg-blue-100 text-blue-600",
  PAYMENT: "bg-green-100 text-green-600",
  EXPIRATION: "bg-orange-100 text-orange-600",
  PROMOTION: "bg-purple-100 text-purple-600",
  SYSTEM: "bg-gray-100 text-gray-600",
}

interface Notification {
  id: string
  title: string
  message: string | null
  type: string
  link: string | null
  isRead: boolean
  createdAt: string
}

// Campaneo del icono (antes framer-motion). Va inline para no depender del pipeline
// de Tailwind/globals y respetar prefers-reduced-motion. Se inyecta una sola vez.
const BELL_CSS = `
@keyframes gzmg-bell-bounce {
  0%,100% { transform: rotate(0) }
  15% { transform: rotate(-15deg) }
  30% { transform: rotate(15deg) }
  45% { transform: rotate(-10deg) }
  60% { transform: rotate(10deg) }
  75% { transform: rotate(-5deg) }
  90% { transform: rotate(5deg) }
}
.gzmg-bell { transform-origin: 50% 0 }
.gzmg-bell.is-ringing { animation: gzmg-bell-bounce .6s ease-in-out }
@media (prefers-reduced-motion: reduce) { .gzmg-bell.is-ringing { animation: none } }
`
let bellCssInjected = false
function injectBellCss() {
  if (bellCssInjected || typeof document === "undefined") return
  bellCssInjected = true
  const el = document.createElement("style")
  el.textContent = BELL_CSS
  document.head.appendChild(el)
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      fetchNotifications().then(({ list, count }) => {
        setNotifications(list)
        setUnreadCount(count)
      })
    }
  }, [open])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications([])
    setUnreadCount(0)
    listCache = null // la lista/conteo compartidos quedaron obsoletos
    router.refresh()
  }

  const handleMarkAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    })
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    listCache = null // la lista/conteo compartidos quedaron obsoletos
    router.refresh()
  }

  // Clic en una notificación: la marca leída y, si trae un destino, navega ahí.
  const handleOpen = (n: Notification) => {
    handleMarkAsRead(n.id)
    if (n.link) {
      setOpen(false)
      router.push(n.link)
    }
  }

  useEffect(() => {
    injectBellCss()
    // Precarga la lista al montar → el menú abre instantáneo (ya trae los datos).
    fetchNotifications().then(({ list, count }) => {
      setNotifications(list)
      setUnreadCount(count)
    })
  }, [])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center rounded-full p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      >
        <Bell className={`h-5 w-5 gzmg-bell ${unreadCount > 0 ? "is-ringing" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-foreground/10 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <Check className="h-3.5 w-3.5" />
                Marcar todo leído
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No hay notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleOpen(notification)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${typeColors[notification.type] || typeColors.SYSTEM}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {timeAgo(new Date(notification.createdAt))}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <Link
            href="/dashboard/notificaciones"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1 rounded-b-xl border-t px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Ver todas
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
