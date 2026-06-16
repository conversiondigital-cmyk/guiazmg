export const dynamic = "force-dynamic"

import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Bell, Shield, Globe } from "@/lib/icons"
import { redirect } from "next/navigation"
import { NotificationPreferencesForm } from "@/components/dashboard/notification-preferences"
import { SecuritySection } from "@/components/dashboard/security-section"

export default async function ConfiguracionPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { userSettings: true },
  })

  const businesses = await prisma.profile.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500">Administra tu cuenta y preferencias</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-400" />
            Datos de la cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nombre</Label>
              <Input defaultValue={user?.name || ""} disabled />
            </div>
            <div>
              <Label>Correo electrónico</Label>
              <Input defaultValue={user?.email || ""} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-600" />
            Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm settings={user?.userSettings as any} userId={session.user.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SecuritySection userId={session.user.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-500" />
            Mis negocios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <p className="text-sm text-gray-400">No tienes negocios registrados</p>
          ) : (
            <div className="space-y-2">
              {businesses.map((b) => (
                <Link
                  key={b.id}
                  href="/dashboard/negocio"
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                >
                  <span className="text-sm font-medium text-gray-900">{b.name}</span>
                  <span className="text-xs text-gray-400">ID: {b.id.slice(0, 8)}...</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
