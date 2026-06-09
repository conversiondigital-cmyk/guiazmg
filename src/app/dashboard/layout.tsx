import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const role = (session.user as any).role

  // Each role has its own panel — dashboard is exclusively for BUSINESS_OWNER
  if (role === "ADMIN")        redirect("/admin")
  if (role === "EDITOR")       redirect("/editor")
  if (role === "SALES_AGENT")  redirect("/agente")
  if (!role || role === "USER") redirect("/cuenta")

  // Fetch profileType for BUSINESS_OWNER
  const profile = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
    select: { profileType: true },
  })
  const profileType: "EMPRENDEDOR" | "NEGOCIO" = profile?.profileType ?? "NEGOCIO"

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar profileType={profileType} />
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/95 backdrop-blur px-6">
          <div className="flex-1">
            <p className="text-sm text-gray-500">
              Bienvenido,{" "}
              <span className="font-medium text-gray-900">{session.user.name}</span>
              {profileType === "EMPRENDEDOR" && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                  Emprendedor
                </span>
              )}
              {profileType === "NEGOCIO" && (
                <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                  Negocio
                </span>
              )}
            </p>
          </div>
          <NotificationDropdown />
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
