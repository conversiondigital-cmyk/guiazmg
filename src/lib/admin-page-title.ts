// Título legible de la sección admin actual, para la barra superior. Antes el
// header repetía la marca "Guía ZMG / Panel Admin" (ya está en el sidebar), lo que
// se veía descuadrado. Ahora muestra DÓNDE estás. Se mapea por el primer segmento
// después de /admin; lo no listado cae al genérico.
const TITLES: Record<string, string> = {
  "": "Resumen general",
  analytics: "Analytics globales",
  estado: "Estado del sistema",
  auditoria: "Auditoría",
  verificaciones: "Verificaciones",
  reviews: "Reseñas",
  reportes: "Reportes",
  reclamos: "Reclamos de negocios",
  blog: "Artículos del blog",
  solicitudes: "Solicitudes",
  negocios: "Perfiles",
  anuncios: "Productos",
  servicios: "Servicios",
  promociones: "Promociones",
  eventos: "Eventos",
  marketplace: "Marketplace",
  categorias: "Categorías",
  subcategorias: "Subcategorías",
  "giros-solicitudes": "Solicitudes de giro",
  etiquetas: "Etiquetas / tags",
  municipios: "Municipios",
  colonias: "Colonias",
  zonas: "Zonas (SEO local)",
  usuarios: "Usuarios",
  editores: "Editores",
  agentes: "Agentes comerciales",
  roles: "Roles y permisos",
  "actividad-usuarios": "Actividad de usuarios",
  planes: "Membresías",
  boosts: "Boosts",
  "boosts-definiciones": "Definiciones de boost",
  pagos: "Pagos",
  financiero: "Financiero",
  cupones: "Cupones descuento",
  "cupones-prueba": "Cupones de prueba",
  "promociones-admin": "Regalos y beneficios",
  seo: "SEO y landing pages",
  busquedas: "Búsquedas populares",
  hero: "Carrusel del inicio",
  importar: "Importaciones",
  webhooks: "Webhooks",
  demo: "Datos demo",
  configuracion: "Configuración",
  search: "Búsqueda",
}

export function adminPageTitle(pathname: string): string {
  const seg = pathname.replace(/^\/admin\/?/, "").split("/")[0] ?? ""
  return TITLES[seg] ?? "Panel de administración"
}
