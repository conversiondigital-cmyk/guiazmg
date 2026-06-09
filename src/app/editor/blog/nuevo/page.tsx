import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PostForm } from "@/components/blog/post-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Nuevo artículo | Blog Guía ZMG" }

export default async function NuevoPostPage() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (role !== "EDITOR" && role !== "ADMIN") redirect("/")

  const isAdmin = role === "ADMIN"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/editor/blog" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Blog
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900">Nuevo artículo</span>
        </div>

        <PostForm isAdmin={isAdmin} />
      </div>
    </div>
  )
}
