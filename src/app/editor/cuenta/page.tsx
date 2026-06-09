import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { User } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Mi cuenta | Editor — Guía ZMG" }

export default async function EditorCuentaPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")
  const role = (session.user as any).role
  if (role !== "EDITOR" && role !== "ADMIN") redirect("/")

  const user = session.user

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-6">
        <User className="h-6 w-6 text-green-700" />
        Mi cuenta
      </h1>

      <div className="rounded-2xl bg-white border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nombre</label>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">{user.name ?? "—"}</div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Correo</label>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">{user.email}</div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Rol</label>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm">
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">{role}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
