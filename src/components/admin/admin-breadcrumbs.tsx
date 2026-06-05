"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const labels: Record<string, string> = {
  admin: "Admin",
  analytics: "Analytics",
  auditoria: "Auditoría",
  usuarios: "Usuarios",
  agentes: "Agentes",
  negocios: "Perfiles",
  marketplace: "Marketplace",
  anuncios: "Productos",
  solicitudes: "Solicitudes",
  reviews: "Reseñas",
  reportes: "Reportes",
  categorias: "Categorías",
  colonias: "Colonias",
  municipios: "Municipios",
  planes: "Membresías",
  boosts: "Boosts",
  pagos: "Pagos",
  cupones: "Cupones",
  seo: "SEO",
  importar: "Importaciones",
  configuracion: "Configuración",
  financiero: "Webhooks",
  branding: "Branding",
  auth: "Autenticación",
  correo: "Correo SMTP",
  sms: "SMS",
  membresias: "Membresías",
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
    <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-2">
          {index === 0 ? <Link href={crumb.href} className="text-slate-300 hover:text-white">{crumb.label}</Link> : <Link href={crumb.href} className="hover:text-white">{crumb.label}</Link>}
          {index < crumbs.length - 1 && <span>/</span>}
        </span>
      ))}
    </nav>
  )
}
