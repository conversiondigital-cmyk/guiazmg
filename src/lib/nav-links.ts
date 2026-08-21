// Enlaces del menú principal, compartidos por el header de escritorio y el móvil
// (antes estaban duplicados en header.tsx y mobile-nav.tsx → dos fuentes de verdad).
export interface NavSubLink {
  href: string
  label: string
  description?: string
}

export interface NavLink {
  href: string
  label: string
  hasDropdown?: boolean
  // Rutas que también resaltan este enlace (fusiones: Explorar cubre búsqueda, mapa y
  // zonas; Agenda cubre eventos y promociones). Si falta, se resalta solo por su href.
  matchPaths?: string[]
}

// Menú consolidado (9 → 6). Una fusión y una separación:
//  · Explorar = Directorio (/search) + Mapa + Zonas → los mismos negocios en 3 vistas.
//  · Promociones y Eventos van SEPARADOS: la promo de lanzamiento necesita
//    visibilidad propia en la barra (antes estaban ocultos bajo "Agenda").
//  · Contacto → se mueve al footer (utilitario, no compite en la barra principal).
export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Inicio" },
  { href: "/search", label: "Explorar", hasDropdown: true, matchPaths: ["/search", "/mapa", "/zonas"] },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/promociones", label: "Promociones" },
  { href: "/eventos", label: "Eventos" },
  { href: "/blog", label: "Blog" },
]

// Las tres vistas del hub "Explorar": el mismo directorio de negocios visto de 3 formas.
export const EXPLORE_VIEWS: NavSubLink[] = [
  { href: "/search", label: "Directorio", description: "Todos los negocios, con filtros" },
  { href: "/mapa", label: "Mapa", description: "Explóralos en el mapa" },
  { href: "/zonas", label: "Por zona", description: "Por municipio y colonia" },
]
