"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"

export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-1 flex-col min-w-0">
      {/* Header */}
      <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Content */}
      <main className="flex-1 overflow-x-auto bg-slate-50">
        <div className="mx-auto max-w-[1600px] p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
