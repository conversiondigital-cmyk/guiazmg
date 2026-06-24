import { type UserRole, type UserStatus, type BusinessStatus, type MembershipPlan, type PaymentStatus } from "./admin-types"

// ============================================================================
// ROLE MAPPINGS
// ============================================================================

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  EDITOR: "Editor",
  SALES_AGENT: "Agente Comercial",
  BUSINESS_OWNER: "Dueño de Negocio",
  USER: "Usuario",
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: "Control total del sistema",
  EDITOR: "Moderación de contenido",
  SALES_AGENT: "Gestión comercial y leads",
  BUSINESS_OWNER: "Dueño de perfil comercial",
  USER: "Usuario registrado",
}

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  ADMIN: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
  },
  EDITOR: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-300",
  },
  SALES_AGENT: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-300",
  },
  BUSINESS_OWNER: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-300",
  },
  USER: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-300",
  },
}

// ============================================================================
// USER STATUS MAPPINGS
// ============================================================================

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Activo",
  suspended: "Suspendido",
  pending: "Pendiente",
  deleted: "Eliminado",
}

export const USER_STATUS_COLORS: Record<UserStatus, { bg: string; text: string }> = {
  active: {
    bg: "bg-green-100",
    text: "text-green-800",
  },
  suspended: {
    bg: "bg-red-100",
    text: "text-red-800",
  },
  pending: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
  },
  deleted: {
    bg: "bg-gray-100",
    text: "text-gray-800",
  },
}

// ============================================================================
// BUSINESS STATUS MAPPINGS
// ============================================================================

export const BUSINESS_STATUS_LABELS: Record<BusinessStatus, string> = {
  draft: "Borrador",
  pending: "Pendiente de aprobación",
  active: "Activo",
  suspended: "Suspendido",
  rejected: "Rechazado",
  archived: "Archivado",
}

export const BUSINESS_STATUS_COLORS: Record<BusinessStatus, { bg: string; text: string }> = {
  draft: {
    bg: "bg-gray-100",
    text: "text-gray-800",
  },
  pending: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
  },
  active: {
    bg: "bg-green-100",
    text: "text-green-800",
  },
  suspended: {
    bg: "bg-red-100",
    text: "text-red-800",
  },
  rejected: {
    bg: "bg-orange-100",
    text: "text-orange-800",
  },
  archived: {
    bg: "bg-slate-100",
    text: "text-slate-800",
  },
}

// ============================================================================
// MEMBERSHIP PLAN MAPPINGS
// ============================================================================

export const MEMBERSHIP_PLAN_LABELS: Record<MembershipPlan, string> = {
  gratuito: "Gratuito",
  emprendedor: "Emprendedor",
  negocio: "Negocio",
  premium: "Premium",
}

export const MEMBERSHIP_PLAN_COLORS: Record<MembershipPlan, { bg: string; text: string }> = {
  gratuito: {
    bg: "bg-gray-100",
    text: "text-gray-800",
  },
  emprendedor: {
    bg: "bg-blue-100",
    text: "text-blue-800",
  },
  negocio: {
    bg: "bg-green-100",
    text: "text-green-800",
  },
  premium: {
    bg: "bg-purple-100",
    text: "text-purple-800",
  },
}

export const MEMBERSHIP_PLAN_PRICES: Record<MembershipPlan, number> = {
  gratuito: 0,
  emprendedor: 49,
  negocio: 149,
  premium: 299,
}

// ============================================================================
// PAYMENT STATUS MAPPINGS
// ============================================================================

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  failed: "Fallido",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string }> = {
  pending: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
  },
  approved: {
    bg: "bg-green-100",
    text: "text-green-800",
  },
  failed: {
    bg: "bg-red-100",
    text: "text-red-800",
  },
  refunded: {
    bg: "bg-blue-100",
    text: "text-blue-800",
  },
  cancelled: {
    bg: "bg-gray-100",
    text: "text-gray-800",
  },
}

// ============================================================================
// ACTION LABELS
// ============================================================================

export const ACTION_LABELS: Record<string, string> = {
  delete: "Eliminar",
  edit: "Editar",
  view: "Ver",
  approve: "Aprobar",
  reject: "Rechazar",
  suspend: "Suspender",
  reactivate: "Reactivar",
  verify: "Verificar",
  unverify: "Desverificar",
  feature: "Destacar",
  unfeature: "Quitar destaque",
  export: "Exportar",
  import: "Importar",
  refresh: "Actualizar",
}

// ============================================================================
// DATE & TIME FORMATS
// ============================================================================

export const DATE_FORMAT = {
  short: "dd/MM/yyyy",
  long: "dd 'de' MMMM 'de' yyyy",
  time: "HH:mm:ss",
  datetime: "dd/MM/yyyy HH:mm:ss",
  iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  relative: "relativo", // will be calculated dynamically
}

// ============================================================================
// PAGINATION DEFAULTS
// ============================================================================

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  LIMITS: [10, 20, 50, 100],
}

// ============================================================================
// TOAST MESSAGES
// ============================================================================

export const TOAST_MESSAGES = {
  createSuccess: "Creado exitosamente",
  updateSuccess: "Actualizado exitosamente",
  deleteSuccess: "Eliminado exitosamente",
  deleteError: "No se puede eliminar, intenta más tarde",
  loadError: "Error al cargar los datos",
  permissionError: "No tienes permisos para realizar esta acción",
  networkError: "Error de conexión, intenta nuevamente",
  validationError: "Por favor revisa los campos requeridos",
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

export const FILTER_OPTIONS = {
  userRoles: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
  userStatus: Object.entries(USER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  businessStatus: Object.entries(BUSINESS_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  membershipPlans: Object.entries(MEMBERSHIP_PLAN_LABELS).map(([value, label]) => ({ value, label })),
  paymentStatus: Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  booleanStatus: [
    { value: "true", label: "Sí" },
    { value: "false", label: "No" },
  ],
}

// ============================================================================
// SIDEBAR CONFIGURATION
// ============================================================================

export const ADMIN_SIDEBAR_SECTIONS = [
  {
    label: "Resumen",
    items: [
      { href: "/admin", label: "Panel Principal", icon: "LayoutDashboard", exact: true },
      { href: "/admin/analytics", label: "Analytics", icon: "BarChart3" },
      { href: "/admin/auditoria", label: "Auditoría", icon: "Shield" },
      { href: "/admin/estado", label: "Estado del Sistema", icon: "Server" },
    ],
  },
  {
    label: "Usuarios y Roles",
    items: [
      { href: "/admin/usuarios", label: "Usuarios", icon: "Users" },
      { href: "/admin/admins", label: "Administradores", icon: "Lock" },
      { href: "/admin/editores", label: "Editores", icon: "Edit3" },
      { href: "/admin/agentes", label: "Agentes", icon: "Briefcase" },
      { href: "/admin/roles", label: "Roles y Permisos", icon: "Shield" },
    ],
  },
  {
    label: "Perfiles y Contenido",
    items: [
      { href: "/admin/perfiles", label: "Perfiles Comerciales", icon: "Store" },
      { href: "/admin/anuncios", label: "Productos", icon: "ShoppingBag" },
      { href: "/admin/servicios", label: "Servicios", icon: "Wrench" },
      { href: "/admin/promociones", label: "Promociones", icon: "Tag" },
      { href: "/admin/marketplace", label: "Marketplace", icon: "Package" },
      { href: "/admin/reviews", label: "Reseñas", icon: "Star" },
      { href: "/admin/reportes", label: "Reportes", icon: "AlertCircle" },
    ],
  },
  {
    label: "Estructura del Directorio",
    items: [
      { href: "/admin/categorias", label: "Categorías", icon: "Grid3" },
      { href: "/admin/subcategorias", label: "Subcategorías", icon: "Grid2" },
      { href: "/admin/municipios", label: "Municipios", icon: "Map" },
      { href: "/admin/colonias", label: "Colonias", icon: "MapPin" },
      { href: "/admin/etiquetas", label: "Etiquetas", icon: "Tag" },
    ],
  },
  {
    label: "Negocio y Monetización",
    items: [
      { href: "/admin/planes", label: "Membresías", icon: "Star" },
      { href: "/admin/boosts", label: "Boosts Activos", icon: "TrendingUp" },
      { href: "/admin/boosts-definiciones", label: "Definiciones de Boosts", icon: "Settings" },
      { href: "/admin/pagos", label: "Pagos", icon: "CreditCard" },
      { href: "/admin/financiero", label: "Financiero", icon: "BarChart3" },
      { href: "/admin/cupones", label: "Cupones", icon: "Gift" },
    ],
  },
  {
    label: "SEO y Crecimiento",
    items: [
      { href: "/admin/seo", label: "SEO Global", icon: "Search" },
      { href: "/admin/busquedas", label: "Búsquedas Populares", icon: "TrendingUp" },
      { href: "/admin/reclamos", label: "Reclamos de Perfil", icon: "CheckCircle" },
    ],
  },
  {
    label: "Operación",
    items: [
      { href: "/admin/importaciones", label: "Importaciones", icon: "Upload" },
      { href: "/admin/webhooks", label: "Webhooks", icon: "Zap" },
    ],
  },
  {
    label: "Configuración",
    items: [
      { href: "/admin/configuracion", label: "Configuración Global", icon: "Settings" },
    ],
  },
]

// ============================================================================
// QUICK ACTIONS
// ============================================================================

export const QUICK_ACTIONS = [
  { label: "Crear Usuario", href: "/admin/usuarios/new", icon: "UserPlus" },
  { label: "Crear Categoría", href: "/admin/categorias/new", icon: "Plus" },
  { label: "Ver Analytics", href: "/admin/analytics", icon: "BarChart3" },
  { label: "Auditoría", href: "/admin/auditoria", icon: "Shield" },
]

// ============================================================================
// ENTITY COUNTS & LIMITS
// ============================================================================

export const ENTITY_LIMITS = {
  maxProductsPerProfile: 1000,
  maxServicesPerProfile: 1000,
  maxPromosPerProfile: 100,
  maxMarketplacePerProfile: 100,
  maxBoostsPerProfile: 50,
  maxUsersPerAdmin: Infinity,
  maxProfilesPerUser: 50,
}

// ============================================================================
// FEATURE FLAGS (defaults, can be overridden in DB config)
// ============================================================================

export const DEFAULT_FEATURE_FLAGS = {
  marketplaceEnabled: true,
  reviewsEnabled: true,
  boostsEnabled: true,
  promosEnabled: true,
  requestsEnabled: true,
  importsEnabled: true,
  webhooksEnabled: true,
  advancedAnalyticsEnabled: true,
  seoToolsEnabled: true,
  bulkActionsEnabled: true,
  maintenanceMode: false,
}
