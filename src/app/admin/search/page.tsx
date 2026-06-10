import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search as SearchIcon } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

const ADMIN_PAGES = [
  // Resumen y monitoreo
  { label: "Resumen general", href: "/admin", section: "Resumen y monitoreo", icon: "LayoutDashboard" },
  { label: "Analytics globales", href: "/admin/analytics", section: "Resumen y monitoreo", icon: "BarChart3" },
  { label: "Auditoría", href: "/admin/auditoria", section: "Resumen y monitoreo", icon: "ClipboardList" },
  { label: "Estado del sistema", href: "/admin/estado", section: "Resumen y monitoreo", icon: "Activity" },
  { label: "Logs del sistema", href: "/admin/logs", section: "Resumen y monitoreo", icon: "FileText" },

  // Usuarios y roles
  { label: "Todos los usuarios", href: "/admin/usuarios", section: "Usuarios y roles", icon: "Users" },
  { label: "Administradores", href: "/admin/admins", section: "Usuarios y roles", icon: "Shield" },
  { label: "Editores", href: "/admin/editores", section: "Usuarios y roles", icon: "Pencil" },
  { label: "Agentes comerciales", href: "/admin/agentes", section: "Usuarios y roles", icon: "Briefcase" },
  { label: "Roles y permisos", href: "/admin/roles", section: "Usuarios y roles", icon: "Lock" },
  { label: "Cuentas suspendidas", href: "/admin/suspendidos", section: "Usuarios y roles", icon: "UserX" },
  { label: "Actividad de usuarios", href: "/admin/actividad-usuarios", section: "Usuarios y roles", icon: "Clock" },

  // Perfiles y contenido
  { label: "Perfiles", href: "/admin/negocios", section: "Perfiles y contenido", icon: "Store" },
  { label: "Productos", href: "/admin/anuncios", section: "Perfiles y contenido", icon: "ShoppingBag" },
  { label: "Servicios", href: "/admin/servicios", section: "Perfiles y contenido", icon: "Wrench" },
  { label: "Promociones", href: "/admin/promociones", section: "Perfiles y contenido", icon: "Tag" },
  { label: "Marketplace", href: "/admin/marketplace", section: "Perfiles y contenido", icon: "Package" },
  { label: "Solicitudes", href: "/admin/solicitudes", section: "Perfiles y contenido", icon: "MessageSquare" },
  { label: "Reseñas", href: "/admin/reviews", section: "Perfiles y contenido", icon: "Star" },
  { label: "Reportes", href: "/admin/reportes", section: "Perfiles y contenido", icon: "Flag" },

  // Estructura del directorio
  { label: "Categorías", href: "/admin/categorias", section: "Estructura del directorio", icon: "Tags" },
  { label: "Subcategorías", href: "/admin/subcategorias", section: "Estructura del directorio", icon: "Layers3" },
  { label: "Municipios", href: "/admin/municipios", section: "Estructura del directorio", icon: "MapPinned" },
  { label: "Colonias", href: "/admin/colonias", section: "Estructura del directorio", icon: "Globe" },
  { label: "Etiquetas", href: "/admin/etiquetas", section: "Estructura del directorio", icon: "Tags" },

  // Negocio y monetización
  { label: "Membresías", href: "/admin/planes", section: "Negocio y monetización", icon: "Gem" },
  { label: "Boosts", href: "/admin/boosts", section: "Negocio y monetización", icon: "Rocket" },
  { label: "Boosts definiciones", href: "/admin/boosts-definiciones", section: "Negocio y monetización", icon: "Rocket" },
  { label: "Pagos", href: "/admin/pagos", section: "Negocio y monetización", icon: "CreditCard" },
  { label: "Cupones", href: "/admin/cupones", section: "Negocio y monetización", icon: "Gift" },

  // Configuración
  { label: "Configuración Global", href: "/admin/configuracion", section: "Configuración", icon: "Settings" },
  { label: "General", href: "/admin/configuracion/general", section: "Configuración", icon: "Settings" },
  { label: "Branding", href: "/admin/configuracion/branding", section: "Configuración", icon: "Settings" },
  { label: "Autenticación", href: "/admin/configuracion/auth", section: "Configuración", icon: "Settings" },
  { label: "Correo SMTP", href: "/admin/configuracion/correo", section: "Configuración", icon: "Settings" },
  { label: "SMS", href: "/admin/configuracion/sms", section: "Configuración", icon: "Settings" },
  { label: "Pagos", href: "/admin/configuracion/pagos", section: "Configuración", icon: "Settings" },
  { label: "Membresías", href: "/admin/configuracion/membresias", section: "Configuración", icon: "Settings" },
  { label: "Boosts", href: "/admin/configuracion/boosts", section: "Configuración", icon: "Settings" },
  { label: "SEO", href: "/admin/configuracion/seo", section: "Configuración", icon: "Settings" },
  { label: "Seguridad", href: "/admin/configuracion/seguridad", section: "Configuración", icon: "Settings" },
  { label: "Storage", href: "/admin/configuracion/storage", section: "Configuración", icon: "Settings" },
  { label: "Moderación", href: "/admin/configuracion/moderacion", section: "Configuración", icon: "Settings" },
  { label: "Legal", href: "/admin/configuracion/legal", section: "Configuración", icon: "Settings" },
  { label: "Feature Flags", href: "/admin/configuracion/flags", section: "Configuración", icon: "Settings" },
]

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const params = await searchParams
  const query = params.q?.trim().toLowerCase() || ""

  if (!query) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Navegación rápida</h1>
          <p className="text-sm text-slate-500">Busca páginas, configuraciones y funcionalidades del admin</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <SearchIcon className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500">Ingresa un término para buscar</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter pages based on query
  const results = ADMIN_PAGES.filter(page =>
    page.label.toLowerCase().includes(query) ||
    page.section.toLowerCase().includes(query) ||
    page.href.toLowerCase().includes(query)
  )

  // Group by section
  const groupedResults = results.reduce((acc, page) => {
    if (!acc[page.section]) {
      acc[page.section] = []
    }
    acc[page.section].push(page)
    return acc
  }, {} as Record<string, typeof ADMIN_PAGES>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Navegación rápida</h1>
        <p className="text-sm text-slate-500">
          Resultados para: <span className="font-medium">"{query}"</span>
          {results.length > 0 && <span className="ml-2">({results.length} páginas encontradas)</span>}
        </p>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <SearchIcon className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500">No se encontraron páginas o configuraciones</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedResults).map(([section, pages]) => (
          <Card key={section}>
            <CardHeader>
              <CardTitle className="text-base">{section}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {pages.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors group"
                  >
                    <div>
                      <p className="font-medium text-slate-900 group-hover:text-slate-950">{page.label}</p>
                    </div>
                    <Badge variant="outline" className="ml-4 text-xs font-mono">
                      {page.href.replace("/admin/", "").split("/")[0] || "inicio"}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
