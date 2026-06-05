import { redirect } from "next/navigation"

// Este panel es exclusivo de /admin. El área /dashboard es solo para el perfil comercial propio.
export default function DashboardAdminRedirect() {
  redirect("/admin")
}
