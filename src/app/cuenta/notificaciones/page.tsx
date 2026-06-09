export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Bell } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Notificaciones | Guía ZMG" }

export default async function NotificacionesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const userId = (session.user as any).id

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Bell className="h-6 w-6 text-green-700" />
          Notificaciones
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{notifications.filter(n => !n.isRead).length} sin leer</p>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-16 text-center">
          <Bell className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">Sin notificaciones</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {notifications.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 px-5 py-4 ${n.isRead ? "" : "bg-green-50/40"}`}>
              {!n.isRead && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-600" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.isRead ? "text-gray-600" : "text-gray-900 font-medium"} line-clamp-2`}>{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className="shrink-0 text-[9px] uppercase font-bold text-gray-300">{n.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
