import { redirect } from "next/navigation"

// Las estadísticas del negocio propio están en /dashboard/estadisticas
export default function DashboardAnalyticsRedirect() {
  redirect("/dashboard/estadisticas")
}
