import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

interface StatusItem {
  label: string
  status: "ok" | "warn" | "error" | "unknown"
  detail: string
  // A dónde ir para resolver la advertencia/el error (solo si aplica).
  href?: string
  actionLabel?: string
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

  // Nota: los nombres de las variables deben coincidir con los que usa el
  // código real (payments usa MERCADO_PAGO_*, el storage usa S3_*), o el
  // estado marcaría "Atención" en falso aunque esté bien configurado.
  const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  const storageBucket = process.env.S3_BUCKET
  const maintenanceOn = process.env.MAINTENANCE_MODE === "true"

  const services: StatusItem[] = [
    {
      label: "Base de datos",
      status: dbStatus,
      detail: dbDetail,
      ...(dbStatus === "error" ? { href: "/admin/configuracion/storage", actionLabel: "Revisar" } : {}),
    },
    {
      label: "Autenticación (Auth.js)",
      status: "ok",
      detail: "Sesión activa y válida",
    },
    {
      label: "Mercado Pago",
      status: mpToken ? "ok" : "warn",
      detail: mpToken
        ? "Access token configurado"
        : "Access token no configurado — los pagos no funcionarán",
      href: "/admin/configuracion/pagos",
      actionLabel: "Configurar pagos",
    },
    {
      label: "Stripe",
      status: process.env.STRIPE_SECRET_KEY ? "ok" : "warn",
      detail: process.env.STRIPE_SECRET_KEY
        ? "Secret key configurada"
        : "No configurado (opcional)",
      href: "/admin/configuracion/pagos",
      actionLabel: "Configurar pagos",
    },
    {
      label: "SMTP / Correo",
      status: process.env.SMTP_HOST ? "ok" : "warn",
      detail: process.env.SMTP_HOST
        ? `Host: ${process.env.SMTP_HOST}`
        : "SMTP no configurado — no se enviarán correos",
      href: "/admin/configuracion/correo",
      actionLabel: "Configurar correo",
    },
    {
      label: "Storage",
      status: storageBucket ? "ok" : "warn",
      detail: storageBucket
        ? `Bucket: ${storageBucket}`
        : "Storage no configurado — no se podrán subir imágenes",
      href: "/admin/configuracion/storage",
      actionLabel: "Configurar storage",
    },
    {
      label: "Modo mantenimiento",
      status: maintenanceOn ? "warn" : "ok",
      detail: maintenanceOn
        ? "Mantenimiento activo — sitio no disponible para usuarios"
        : "Sitio disponible al público",
      ...(maintenanceOn ? { href: "/admin/configuracion/general", actionLabel: "Desactivar" } : {}),
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
  // Primer servicio que requiere atención y tiene a dónde llevar al admin.
  const firstAttention = services.find(
    (s) => (s.status === "error" || s.status === "warn") && s.href
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estado del sistema</h1>
          <p className="text-sm text-muted-foreground">
            Monitoreo en tiempo real de los servicios de Guía ZMG
          </p>
        </div>
        {globalStatus !== "ok" && firstAttention ? (
          <Link href={firstAttention.href!}>
            <Badge
              variant="outline"
              className={`${statusColor[globalStatus]} inline-flex items-center gap-1 transition-opacity hover:opacity-80`}
            >
              {globalStatus === "warn" ? "Atención requerida" : "Fallo crítico"}
              <ArrowRight className="h-3 w-3" />
            </Badge>
          </Link>
        ) : (
          <Badge variant="outline" className={statusColor[globalStatus]}>
            {globalStatus === "ok" ? "Todos los sistemas operativos" : globalStatus === "warn" ? "Atención requerida" : "Fallo crítico"}
          </Badge>
        )}
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
        {services.map((svc) => {
          const needsAttention = svc.status === "warn" || svc.status === "error"
          const clickable = needsAttention && !!svc.href
          const inner = (
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{svc.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{svc.detail}</p>
                {clickable && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    {svc.actionLabel ?? "Resolver"}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                )}
              </div>
              <Badge variant="outline" className={statusColor[svc.status]}>
                {statusLabel[svc.status]}
              </Badge>
            </CardContent>
          )
          return clickable ? (
            <Link key={svc.label} href={svc.href!} className="block">
              <Card className="transition-colors hover:border-emerald-300 hover:bg-emerald-50/40">
                {inner}
              </Card>
            </Link>
          ) : (
            <Card key={svc.label}>{inner}</Card>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Verificado el {new Date().toLocaleString("es-MX")}
      </p>
    </div>
  )
}
