import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Webhook } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_STYLES: Record<string, string> = {
  PROCESSED: "bg-green-100 text-green-700",
  RECEIVED: "bg-blue-100 text-blue-700",
  ERROR: "bg-red-100 text-red-700",
}

export default async function AdminWebhooksPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const events = await prisma.webhookEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Webhooks</h1>
        <p className="text-sm text-muted-foreground">
          Eventos recibidos desde Mercado Pago, Stripe y otros proveedores externos
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Mercado Pago", detail: process.env.MERCADO_PAGO_WEBHOOK_SECRET ? "Configurado" : "No configurado" },
          { label: "Stripe", detail: process.env.STRIPE_WEBHOOK_SECRET ? "Configurado" : "No configurado" },
          { label: "Eventos recientes", detail: `${events.length} registrados` },
        ].map((w) => (
          <Card key={w.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{w.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{w.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log de webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="py-12 text-center">
              <Webhook className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                Aún no se han registrado eventos de webhook
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Los eventos de pago entrantes (Mercado Pago) se registrarán aquí con su estado y metadata.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Proveedor</th>
                    <th className="py-2 pr-4 font-medium">Evento</th>
                    <th className="py-2 pr-4 font-medium">ID</th>
                    <th className="py-2 pr-4 font-medium">Estado</th>
                    <th className="py-2 pr-4 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 align-top">
                      <td className="py-2 pr-4 font-medium">{e.provider}</td>
                      <td className="py-2 pr-4">{e.eventType ?? "—"}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{e.eventId ?? "—"}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            STATUS_STYLES[e.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {e.status}
                        </span>
                        {e.error && (
                          <p className="mt-1 max-w-xs truncate text-xs text-red-500" title={e.error}>
                            {e.error}
                          </p>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">
                        {e.createdAt.toLocaleString("es-MX")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
