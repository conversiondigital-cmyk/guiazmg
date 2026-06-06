import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth()

  if (!session?.user) redirect("/auth/login")
  if (session.user.role !== "ADMIN") redirect("/")

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar oscuro fijo a la izquierda */}
      <AdminSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        }}
      />

      {/* Área de contenido */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Barra de comando superior — oscura, distinta del dashboard de negocio */}
        <header className="sticky top-0 z-30 border-b border-slate-700 bg-slate-800 text-white">
          <div className="mx-auto flex h-12 max-w-[1600px] items-center gap-4 px-6">

            {/* Breadcrumbs de navegación administrativa */}
            <AdminBreadcrumbs />

            {/* Lado derecho: email + badge de rol */}
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden font-mono text-xs text-slate-400 sm:block">
                {session.user.email}
              </span>
              <span className="inline-flex items-center rounded border border-red-800/60 bg-red-900/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-300">
                {session.user.role ?? "ADMIN"}
              </span>
            </div>
          </div>
        </header>

        {/* Contenido de la página */}
        <main className="flex-1 overflow-x-auto">
          <div className="mx-auto max-w-[1600px] p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
