export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Settings, User, Bell, Shield } from "lucide-react"
import { Metadata } from "next"
import { SecuritySection } from "@/components/dashboard/security-section"
import { NotificationPreferencesForm } from "@/components/dashboard/notification-preferences"

export const metadata: Metadata = { title: "Configuración | Guía ZMG" }

export default async function ConfiguracionPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: { userSettings: true },
  })
  if (!user) redirect("/auth/login")

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-green-700" />
          Configuración de cuenta
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Administra tu información personal y preferencias</p>
      </div>

      {/* Profile info */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="h-4 w-4 text-green-700" />
          <h2 className="font-bold text-gray-900">Información personal</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nombre</label>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
              {user.name ?? "—"}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Correo electrónico</label>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
              {user.email}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Miembro desde</label>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-400">
              {new Date(user.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="h-4 w-4 text-green-700" />
          <h2 className="font-bold text-gray-900">Notificaciones</h2>
        </div>
        <NotificationPreferencesForm settings={user.userSettings as any} userId={user.id} />
      </div>

      {/* Security */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="h-4 w-4 text-green-700" />
          <h2 className="font-bold text-gray-900">Seguridad</h2>
        </div>
        <SecuritySection userId={user.id} />
      </div>
    </div>
  )
}
