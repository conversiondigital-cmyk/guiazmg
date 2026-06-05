"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const labels: Record<string, string> = {
  admin: "Admin",
  analytics: "Analytics",
  auditoria: "Auditoría",
  estado: "Estado del sistema",
  logs: "Logs",
  usuarios: "Usuarios",
  admins: "Administradores",
  editores: "Editores",
  agentes: "Agentes",
  roles: "Roles y permisos",
  suspendidos: "Cuentas suspendidas",
  "actividad-usuarios": "Actividad de usuarios",
  negocios: "Perfiles",
  perfiles: "Perfiles",
  anuncios: "Productos",
  productos: "Productos",
  servicios: "Servicios",
  promociones: "Promociones",
  marketplace: "Marketplace",
  solicitudes: "Solicitudes",
  reviews: "Reseñas",
  resenas: "Reseñas",
  reportes: "Reportes",
  categorias: "Categorías",
  subcategorias: "Subcategorías",
  municipios: "Municipios",
  colonias: "Colonias",
  etiquetas: "Etiquetas",
  planes: "Membresías",
  membresias: "Membresías",
  boosts: "Boosts",
  "boosts-definiciones": "Definiciones de boost",
  pagos: "Pagos",
  financiero: "Financiero",
  cupones: "Cupones descuento",
  "promociones-admin": "Regalos y beneficios",
  seo: "SEO",
  "landing-pages": "Landing pages",
  busquedas: "Búsquedas populares",
  reclamos: "Reclamos",
  claims: "Reclamos",
  importar: "Importaciones",
  importaciones: "Importaciones",
  webhooks: "Webhooks",
  configuracion: "Configuración",
  general: "General",
  branding: "Branding",
  auth: "Autenticación",
  correo: "Correo SMTP",
  sms: "SMS",
  seguridad: "Seguridad",
  storage: "Storage",
  moderacion: "Moderación",
  legal: "Legal",
  flags: "Feature Flags",
}

export function AdminBreadcrumbs() {
  const pathname = usePathname()
  const parts = pathname.split("/").filter(Boolean)

  if (parts[0] !== "admin") return null

  const crumbs = parts.map((part, index) => {
    const href = "/" + parts.slice(0, index + 1).join("/")
    return { href, label: labels[part] ?? part }
  })

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {index < crumbs.length - 1 ? (
            <Link href={crumb.href} className="text-slate-300 hover:text-white transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-white font-medium">{crumb.label}</span>
          )}
          {index < crumbs.length - 1 && <span className="text-slate-600">/</span>}
        </span>
      ))}
    </nav>
  )
}
