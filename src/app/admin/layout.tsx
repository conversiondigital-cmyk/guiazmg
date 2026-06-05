import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"

const allowedRoles = ["ADMIN"]

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (!allowedRoles.includes(session.user.role ?? "")) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <AdminSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        }}
      />
      <main className="flex-1 lg:overflow-x-auto">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-20 max-w-[1600px] flex-col justify-center gap-2 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Panel de Administración</p>
                <h1 className="text-lg font-semibold text-slate-950">{session.user.name || "Administrador"}</h1>
              </div>
              <div className="hidden rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white sm:inline-flex">
                {session.user.role || "ADMIN"}
              </div>
            </div>
            <AdminBreadcrumbs />
          </div>
        </header>
        <div className="mx-auto max-w-[1600px] p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
