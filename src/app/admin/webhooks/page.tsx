import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Webhook } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminWebhooksPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

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
          { label: "Mercado Pago", detail: process.env.MERCADOPAGO_WEBHOOK_SECRET ? "Configurado" : "No configurado" },
          { label: "Stripe", detail: process.env.STRIPE_WEBHOOK_SECRET ? "Configurado" : "No configurado" },
          { label: "Idempotencia", detail: "Activa (tabla idempotency_keys)" },
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
        <CardContent className="py-12 text-center">
          <Webhook className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Módulo de log de webhooks pendiente de implementación
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Los eventos de pago se registran en la tabla de pagos con su metadata.
            Un log detallado de webhooks requiere una tabla dedicada de eventos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
