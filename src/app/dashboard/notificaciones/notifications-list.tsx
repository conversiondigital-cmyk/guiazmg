"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { timeAgo } from "@/lib/utils"
import {
  Bell,
  Star,
  MessageCircle,
  CreditCard,
  Clock,
  Megaphone,
  Check,
} from "@/lib/icons"

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
  MESSAGE: "bg-green-100 text-green-700",
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
  isRead: boolean
  createdAt: string
}

interface Props {
  notifications: Notification[]
  unreadCount: number
}

export function NotificationsList({ notifications: initial, unreadCount: initialUnread }: Props) {
  const [notifications, setNotifications] = useState(initial)
  const [unreadCount, setUnreadCount] = useState(initialUnread)
  const [tab, setTab] = useState<"all" | "unread">("all")
  const router = useRouter()

  const filtered = tab === "unread" ? notifications.filter((n) => !n.isRead) : notifications

  const markAsRead = async (id: string) => {
    if (notifications.find((n) => n.id === id)?.isRead) return
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    router.refresh()
  }

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-500">
            {unreadCount > 0
              ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? "es" : ""} sin leer`
              : "No hay notificaciones sin leer"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <Check className="mr-1.5 h-4 w-4" />
            Marcar todo leído
          </Button>
        )}
      </div>

      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab("all")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            tab === "all"
              ? "border-blue-600 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Todas
        </button>
        <button
          onClick={() => setTab("unread")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            tab === "unread"
              ? "border-blue-600 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          No leídas
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-green-700 px-1.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            {tab === "unread" ? "No hay notificaciones sin leer" : "No hay notificaciones"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification) => {
            const Icon = typeIcons[notification.type] || Bell
            return (
              <button
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={cn(
                  "flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-gray-50",
                  !notification.isRead && "bg-green-50/50 border-green-100"
                )}
              >
                <div
                  className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-full " + (typeColors[notification.type] || typeColors.SYSTEM)}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm",
                        !notification.isRead ? "font-semibold text-gray-900" : "text-gray-700"
                      )}
                    >
                      {notification.title}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-green-700" />
                      )}
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {timeAgo(new Date(notification.createdAt))}
                      </span>
                    </div>
                  </div>
                  {notification.message && (
                    <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {notifications.length >= 50 && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={async () => {
              const page = Math.floor(notifications.length / 20) + 1
              const res = await fetch(`/api/notifications?page=${page}`)
              const data = await res.json()
              if (data.data?.length) {
                setNotifications((prev) => [...prev, ...data.data])
              }
            }}
          >
            Cargar más
          </Button>
        </div>
      )}
    </div>
  )
}
