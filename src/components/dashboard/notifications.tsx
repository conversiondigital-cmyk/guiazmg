"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "@/lib/icons"

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  read: boolean
  createdAt: Date
}

interface NotificationsPanelProps {
  notifications: Notification[]
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  if (!notifications.length) {
    return (
      <Card>
        <CardContent className="p-5 text-center text-sm text-gray-400">
          Sin notificaciones recientes
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-600" />
          Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-lg border p-3 text-sm ${
              n.read ? "border-gray-100" : "border-blue-100 bg-blue-50"
            }`}
          >
            <p className="font-medium text-gray-900">{n.title}</p>
            {n.message && <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>}
            <p className="text-[10px] text-gray-400 mt-1">
              {new Date(n.createdAt).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
