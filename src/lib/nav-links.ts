// Enlaces del menú principal, compartidos por el header de escritorio y el móvil
// (antes estaban duplicados en header.tsx y mobile-nav.tsx → dos fuentes de verdad).
export interface NavLink {
  href: string
  label: string
  hasDropdown?: boolean
}

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Inicio" },
  { href: "/search", label: "Categorías", hasDropdown: true },
  { href: "/mapa", label: "Mapa" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/eventos", label: "Eventos" },
  { href: "/promociones", label: "Promociones" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
]
