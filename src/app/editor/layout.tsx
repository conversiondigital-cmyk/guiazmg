import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { EditorSidebar } from "./editor-sidebar"

export default async function EditorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "EDITOR") {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen">
      <EditorSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role,
        }}
      />
      <main className="flex-1 overflow-x-auto">
        {children}
      </main>
    </div>
  )
}
