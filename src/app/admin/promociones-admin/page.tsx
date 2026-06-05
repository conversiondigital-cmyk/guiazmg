import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award } from "lucide-react"

export const dynamic = "force-dynamic"

const BENEFIT_TYPES = [
  { label: "Regalo de plan", description: "Otorgar días o meses de un plan de membresía sin cobro" },
  { label: "Upgrade temporal", description: "Subir temporalmente el plan de un perfil a un nivel superior" },
  { label: "Regalo de boost", description: "Dar boost gratuito a un perfil por un periodo determinado" },
  { label: "Campaña de lanzamiento", description: "Aplicar beneficio masivo a un grupo de perfiles" },
]

export default async function AdminPromocionesAdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Regalos y beneficios</h1>
        <p className="text-sm text-muted-foreground">
          Herramientas para otorgar beneficios administrativos a perfiles y usuarios:
          planes gratis, upgrades temporales y boosts de regalo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {BENEFIT_TYPES.map((b) => (
          <Card key={b.label} className="border-dashed">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-medium">{b.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{b.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <Award className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Módulo en construcción
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Esta sección permitirá crear campañas de beneficios, asignar planes gratuitos
            manualmente y gestionar upgrades temporales por perfil o grupo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
