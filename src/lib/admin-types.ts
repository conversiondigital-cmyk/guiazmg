// ============================================================================
// SIDEBAR & NAVIGATION
// ============================================================================

export interface SidebarSection {
  title: string
  items: SidebarItem[]
}

export interface SidebarItem {
  label: string
  href: string
  icon: string
  roles: ("ADMIN" | "EDITOR" | "SALES_AGENT")[]
}

export type UserRole = "ADMIN" | "EDITOR" | "SALES_AGENT" | "BUSINESS_OWNER" | "USER"
export type UserStatus = "active" | "suspended" | "pending" | "deleted"
export type BusinessStatus = "draft" | "pending" | "active" | "suspended" | "rejected" | "archived"
export type MembershipPlan = "gratuito" | "emprendedor" | "negocio" | "premium"
export type PaymentStatus = "pending" | "approved" | "failed" | "refunded" | "cancelled"

// ============================================================================
// ADMIN TABLE & DATA DISPLAY
// ============================================================================

export interface AdminTableColumn<T> {
  id: keyof T | string
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  className?: string
  formatter?: (value: unknown, row: T) => React.ReactNode
}

export interface AdminFilter {
  type: "text" | "select" | "multi-select" | "date-range" | "number-range" | "status"
  key: string
  label: string
  placeholder?: string
  options?: Array<{ value: string; label: string; color?: string }>
  defaultValue?: string | string[]
}

export interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[]
  data: T[]
  loading?: boolean
  filters?: AdminFilter[]
  pagination?: {
    page: number
    limit: number
    total: number
  }
  onPaginationChange?: (page: number) => void
  onFilterChange?: (filters: Record<string, unknown>) => void
  onSort?: (column: string, direction: "asc" | "desc") => void
  onRowSelect?: (row: T) => void
  onRowAction?: (row: T, action: string) => void
  selectable?: boolean
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: (rows: T[]) => void | Promise<void>
    variant?: "default" | "destructive" | "secondary"
  }>
  emptyMessage?: string
  rowActions?: Array<{
    label: string
    onClick: (row: T) => void
    icon?: React.ReactNode
    variant?: "default" | "destructive"
    visible?: (row: T) => boolean
  }>
}

export interface TableState {
  page: number
  limit: number
  sortBy?: string
  sortDir?: "asc" | "desc"
  filters: Record<string, unknown>
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

export interface BulkActionRequest {
  entityIds: string[]
  action: string
  params?: Record<string, unknown>
}

export interface BulkActionResponse {
  success: number
  failed: number
  errors?: Array<{ id: string; error: string }>
}

// ============================================================================
// PAGINATION & FILTERING
// ============================================================================

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface FilterConfig {
  [key: string]: unknown
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ============================================================================
// ADMIN DATA MODELS (Display Layer)
// ============================================================================

export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: UserRole
  status: UserStatus
  businessCount: number
  createdAt: Date
  lastLoginAt: Date | null
}

export interface AdminBusiness {
  id: string
  name: string
  owner: { id: string; email: string; name: string | null }
  status: BusinessStatus
  category: string
  municipality: string
  plan: MembershipPlan
  productCount: number
  serviceCount: number
  boostCount: number
  rating: number
  reviewCount: number
  createdAt: Date
  verifiedAt: Date | null
}

export interface AdminPayment {
  id: string
  user: { id: string; email: string }
  amount: number
  currency: string
  status: PaymentStatus
  type: "membership" | "boost"
  description: string
  createdAt: Date
  completedAt: Date | null
  metadata?: Record<string, unknown>
}

export interface AdminMetrics {
  totalUsers: number
  totalBusinesses: number
  activeBusinesses: number
  pendingBusinesses: number
  totalProducts: number
  totalServices: number
  activePromos: number
  activeBoosts: number
  totalReviews: number
  openReports: number
  monthlyRevenue: number
  monthlyLeads: number
}

export interface AdminAuditLog {
  id: string
  userId: string
  userEmail: string
  action: string
  entityType: string
  entityId: string
  entityName?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  metadata?: Record<string, unknown>
  createdAt: Date
}

// ============================================================================
// FORMS & VALIDATION
// ============================================================================

export interface AdminFormField {
  name: string
  label: string
  type: "text" | "email" | "password" | "number" | "select" | "multi-select" | "checkbox" | "textarea" | "date" | "datetime"
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: Array<{ value: string; label: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
    message?: string
  }
  help?: string
}

export interface AdminFormProps {
  fields: AdminFormField[]
  initialValues?: Record<string, unknown>
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>
  loading?: boolean
  error?: string
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
}

// ============================================================================
// MODALS & DIALOGS
// ============================================================================

export interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive" | "warning"
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  loading?: boolean
}

export interface BulkActionDialogProps {
  title: string
  entityCount: number
  fields: AdminFormField[]
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>
  onCancel: () => void
  loading?: boolean
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface AdminConfigSection {
  id: string
  title: string
  description: string
  icon?: React.ReactNode
  fields: AdminFormField[]
}

export interface SystemConfig {
  general?: {
    siteName: string
    supportEmail: string
    supportPhone: string
    timezone: string
    currency: string
    maintenanceMode: boolean
  }
  branding?: {
    logoUrl: string
    faviconUrl: string
    primaryColor: string
    secondaryColor: string
  }
  auth?: {
    googleOAuthEnabled: boolean
    registrationOpen: boolean
    sessionTimeout: number
    passwordMinLength: number
  }
  smtp?: {
    host: string
    port: number
    username: string
    password: string
    fromEmail: string
    fromName: string
    tlsEnabled: boolean
  }
  sms?: {
    provider: "twilio" | "aws-sns" | "none"
    apiKey: string
    senderId: string
  }
  payments?: {
    provider: "mercadopago" | "stripe" | "both"
    mercadopagoAccessToken?: string
    mercadopagoPublicKey?: string
    stripeSecretKey?: string
    stripePublicKey?: string
    sandbox: boolean
  }
  storage?: {
    provider: "s3" | "local" | "cloudinary"
    bucket?: string
    region?: string
    maxFileSize: number
    allowedMimeTypes: string[]
  }
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  statusCode?: number
}
