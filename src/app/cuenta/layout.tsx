import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CuentaSidebar } from "@/components/cuenta/cuenta-sidebar"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const role = (session.user as any).role

  // Business owners and special roles have their own panels
  if (role === "ADMIN")         redirect("/admin")
  if (role === "EDITOR")        redirect("/editor")
  if (role === "SALES_AGENT")   redirect("/agente")
  if (role === "BUSINESS_OWNER") redirect("/dashboard")

  // Dueño de un negocio cuyo rol quedó en USER (no se promovió al registrar):
  // su área también es el dashboard del negocio, no la cuenta de usuario. Así
  // no queda atorado sin enlace para editar su negocio.
  const ownsBusiness = await prisma.profile.findFirst({
    where: { ownerId: session.user.id, deletedAt: null },
    select: { id: true },
  })
  if (ownsBusiness) redirect("/dashboard")

  return (
    <div className="flex min-h-screen bg-gray-50">
      <CuentaSidebar />
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/95 backdrop-blur px-6">
          <div className="flex-1">
            <p className="text-sm text-gray-500">
              Hola,{" "}
              <span className="font-medium text-gray-900">{session.user.name ?? session.user.email}</span>
            </p>
          </div>
          <NotificationDropdown />
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
