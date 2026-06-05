import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

interface StatusItem {
  label: string
  status: "ok" | "warn" | "error" | "unknown"
  detail: string
}

export default async function AdminEstadoPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  // Check DB connectivity via a lightweight query
  let dbStatus: "ok" | "error" = "error"
  let dbDetail = "Sin conexión"
  try {
    const { prisma } = await import("@/lib/prisma")
    await prisma.$queryRaw`SELECT 1`
    dbStatus = "ok"
    dbDetail = "PostgreSQL conectado"
  } catch {
    dbDetail = "No se pudo conectar a la base de datos"
  }

  const services: StatusItem[] = [
    {
      label: "Base de datos",
      status: dbStatus,
      detail: dbDetail,
    },
    {
      label: "Autenticación (Auth.js)",
      status: "ok",
      detail: "Sesión activa y válida",
    },
    {
      label: "Mercado Pago",
      status: process.env.MERCADOPAGO_ACCESS_TOKEN ? "ok" : "warn",
      detail: process.env.MERCADOPAGO_ACCESS_TOKEN
        ? "Access token configurado"
        : "Access token no configurado en variables de entorno",
    },
    {
      label: "Stripe",
      status: process.env.STRIPE_SECRET_KEY ? "ok" : "warn",
      detail: process.env.STRIPE_SECRET_KEY
        ? "Secret key configurada"
        : "No configurado (opcional)",
    },
    {
      label: "SMTP / Correo",
      status: process.env.SMTP_HOST ? "ok" : "warn",
      detail: process.env.SMTP_HOST
        ? `Host: ${process.env.SMTP_HOST}`
        : "SMTP no configurado en variables de entorno",
    },
    {
      label: "Storage",
      status: process.env.STORAGE_BUCKET ? "ok" : "warn",
      detail: process.env.STORAGE_BUCKET
        ? `Bucket: ${process.env.STORAGE_BUCKET}`
        : "Storage no configurado",
    },
    {
      label: "Modo mantenimiento",
      status: process.env.MAINTENANCE_MODE === "true" ? "warn" : "ok",
      detail: process.env.MAINTENANCE_MODE === "true"
        ? "⚠ Mantenimiento activo — sitio no disponible para usuarios"
        : "Sitio disponible al público",
    },
  ]

  const statusColor = {
    ok: "bg-green-100 text-green-800 border-green-200",
    warn: "bg-yellow-100 text-yellow-800 border-yellow-200",
    error: "bg-red-100 text-red-800 border-red-200",
    unknown: "bg-gray-100 text-gray-700 border-gray-200",
  }
  const statusLabel = { ok: "OK", warn: "Atención", error: "Error", unknown: "Desconocido" }

  const okCount = services.filter((s) => s.status === "ok").length
  const warnCount = services.filter((s) => s.status === "warn").length
  const errorCount = services.filter((s) => s.status === "error").length
  const globalStatus = errorCount > 0 ? "error" : warnCount > 0 ? "warn" : "ok"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estado del sistema</h1>
          <p className="text-sm text-muted-foreground">
            Monitoreo en tiempo real de los servicios de Guía ZMG
          </p>
        </div>
        <Badge
          variant="outline"
          className={statusColor[globalStatus]}
        >
          {globalStatus === "ok" ? "Todos los sistemas operativos" : globalStatus === "warn" ? "Atención requerida" : "Fallo crítico"}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Servicios OK</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{okCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Con advertencias</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{warnCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Con errores</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{errorCount}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((svc) => (
          <Card key={svc.label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{svc.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{svc.detail}</p>
              </div>
              <Badge variant="outline" className={statusColor[svc.status]}>
                {statusLabel[svc.status]}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Verificado el {new Date().toLocaleString("es-MX")}
      </p>
    </div>
  )
}
