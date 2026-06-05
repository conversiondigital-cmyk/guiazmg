import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AgentSidebar } from "./agent-sidebar"

export default async function AgentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (!["SALES_AGENT", "ADMIN"].includes(session.user.role ?? "")) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen">
      <AgentSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role,
        }}
      />
      <main className="flex-1 overflow-x-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  )
}
