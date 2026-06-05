import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

const ROLES = [
  {
    role: "ADMIN",
    color: "bg-red-100 text-red-800 border-red-200",
    description: "Control total del sistema. Acceso a todas las secciones de /admin.",
    accesses: ["/admin/*", "/editor/*", "/agente/*", "/dashboard/*"],
    cant: [],
  },
  {
    role: "EDITOR",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Moderación de contenido. Accede solo al panel de editor para revisar y aprobar contenido.",
    accesses: ["/editor/*"],
    cant: ["/admin/*", "/agente/*"],
  },
  {
    role: "SALES_AGENT",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Agente comercial. Accede al CRM de /agente para gestionar prospectos y comisiones.",
    accesses: ["/agente/*"],
    cant: ["/admin/*", "/editor/*"],
  },
  {
    role: "BUSINESS_OWNER",
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Dueño de perfil comercial. Solo accede a su dashboard propio.",
    accesses: ["/dashboard/*"],
    cant: ["/admin/*", "/editor/*", "/agente/*"],
  },
  {
    role: "USER",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    description: "Usuario general. Puede buscar, reseñar, usar marketplace y guardar favoritos.",
    accesses: ["Sitio público", "/dashboard/* (solo cuenta personal)"],
    cant: ["/admin/*", "/editor/*", "/agente/*"],
  },
]

export default async function AdminRolesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roles y permisos</h1>
        <p className="text-sm text-muted-foreground">
          Definición de roles del sistema y sus niveles de acceso
        </p>
      </div>

      <div className="grid gap-4">
        {ROLES.map((r) => (
          <Card key={r.role}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={r.color + " font-mono text-sm"}>
                  {r.role}
                </Badge>
                <CardTitle className="text-base font-medium">{r.description}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Puede acceder
                  </p>
                  <ul className="space-y-1">
                    {r.accesses.map((a) => (
                      <li key={a} className="flex items-center gap-2 text-sm text-green-700">
                        <span className="text-green-500">✓</span>
                        <code className="text-xs">{a}</code>
                      </li>
                    ))}
                  </ul>
                </div>
                {r.cant.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Sin acceso
                    </p>
                    <ul className="space-y-1">
                      {r.cant.map((c) => (
                        <li key={c} className="flex items-center gap-2 text-sm text-red-600">
                          <span className="text-red-400">✕</span>
                          <code className="text-xs">{c}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 text-sm text-amber-800">
          <strong>Nota de seguridad:</strong> Los guards de acceso están implementados en los layouts
          de cada panel. Cambiar el rol de un usuario en la base de datos tiene efecto inmediato
          en la próxima solicitud autenticada.
        </CardContent>
      </Card>
    </div>
  )
}
