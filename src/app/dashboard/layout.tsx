import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/95 backdrop-blur px-6">
          <div className="flex-1">
            <p className="text-sm text-gray-500">
              Bienvenido, <span className="font-medium text-gray-900">{session.user.name}</span>
            </p>
          </div>
          <NotificationDropdown />
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
