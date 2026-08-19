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

// Menú consolidado (9 → 5). Tres fusiones:
//  · Explorar = Directorio (/search) + Mapa + Zonas → los mismos negocios en 3 vistas.
//  · Agenda   = Eventos + Promociones → "qué está pasando" en un solo lugar.
//  · Contacto → se mueve al footer (utilitario, no compite en la barra principal).
export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Inicio" },
  { href: "/search", label: "Explorar", hasDropdown: true, matchPaths: ["/search", "/mapa", "/zonas"] },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/agenda", label: "Agenda", matchPaths: ["/agenda", "/eventos", "/promociones"] },
  { href: "/blog", label: "Blog" },
]

// Las tres vistas del hub "Explorar": el mismo directorio de negocios visto de 3 formas.
export const EXPLORE_VIEWS: NavSubLink[] = [
  { href: "/search", label: "Directorio", description: "Todos los negocios, con filtros" },
  { href: "/mapa", label: "Mapa", description: "Explóralos en el mapa" },
  { href: "/zonas", label: "Por zona", description: "Por municipio y colonia" },
]

// Sub-secciones del hub "Agenda" (para el menú móvil).
export const AGENDA_VIEWS: NavSubLink[] = [
  { href: "/eventos", label: "Eventos", description: "Qué hacer cerca de ti" },
  { href: "/promociones", label: "Promociones", description: "Ofertas de negocios locales" },
]
