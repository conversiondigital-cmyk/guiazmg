import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PostForm } from "@/components/blog/post-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Metadata } from "next"

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id }, select: { title: true } })
  return { title: `Editar: ${post?.title ?? "Post"} | Blog Guía ZMG` }
}

export default async function EditPostPage({ params }: Props) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (role !== "EDITOR" && role !== "ADMIN") redirect("/")

  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) notFound()

  const initialData = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImageUrl: post.coverImageUrl,
    category: post.category,
    tags: post.tags,
    status: post.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    readTimeMinutes: post.readTimeMinutes,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/editor/blog" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Blog
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900 line-clamp-1">{post.title}</span>
        </div>

        <PostForm initialData={initialData} />
      </div>
    </div>
  )
}
