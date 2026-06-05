import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus } from "lucide-react"

export default async function ProspectosPage() {
  const session = await auth()
  if (!session?.user || !["SALES_AGENT", "ADMIN"].includes(session.user.role ?? "")) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Prospectos</h1>
        <p className="text-gray-500">Gestiona tu pipeline de prospectos y clientes potenciales</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de prospectos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <UserPlus className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Sin prospectos</h3>
            <p className="mt-2 text-sm text-gray-500">
              Aquí aparecerán los negocios y emprendedores que estás prospectando.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
