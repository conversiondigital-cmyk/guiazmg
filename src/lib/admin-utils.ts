export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export function getStatusBadge(status: string): string {
  const variants: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    PENDING_REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    DISMISSED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    CONTACTED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    QUALIFIED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    CONVERTED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  }
  return variants[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
}

export function canAccess(role: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(role)
}
