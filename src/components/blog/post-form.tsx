"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { RichEditor } from "./rich-editor"
import { Save, Eye, Globe, Archive, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const CATEGORIES = [
  "Marketing Digital", "Restaurantes", "Servicio al Cliente",
  "Marketing", "Diseño", "Emprendimiento", "Finanzas", "Tecnología",
  "Turismo", "Salud", "Educación", "Eventos",
]

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 100)
}

function estimateReadTime(html: string) {
  const text = html.replace(/<[^>]*>/g, " ")
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

interface PostFormProps {
  initialData?: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    content: string
    coverImageUrl: string | null
    category: string | null
    tags: string[]
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
    readTimeMinutes: number
    metaTitle: string | null
    metaDescription: string | null
  }
}

export function PostForm({ initialData }: PostFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [title, setTitle]         = useState(initialData?.title ?? "")
  const [slug, setSlug]           = useState(initialData?.slug ?? "")
  const [excerpt, setExcerpt]     = useState(initialData?.excerpt ?? "")
  const [content, setContent]     = useState(initialData?.content ?? "")
  const [coverUrl, setCoverUrl]   = useState(initialData?.coverImageUrl ?? "")
  const [category, setCategory]   = useState(initialData?.category ?? "")
  const [tagsInput, setTagsInput] = useState((initialData?.tags ?? []).join(", "))
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle ?? "")
  const [metaDesc, setMetaDesc]   = useState(initialData?.metaDescription ?? "")
  const [slugManual, setSlugManual] = useState(isEdit)
  const [saving, setSaving]       = useState<"draft" | "publish" | null>(null)
  const [error, setError]         = useState("")
  const [seoOpen, setSeoOpen]     = useState(false)

  const handleTitleChange = (v: string) => {
    setTitle(v)
    if (!slugManual) setSlug(slugify(v))
  }

  const handleContentChange = useCallback((html: string) => {
    setContent(html)
  }, [])

  const save = async (status: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    setError("")
    setSaving(status === "DRAFT" ? "draft" : "publish")

    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
    const readTimeMinutes = estimateReadTime(content)

    const body = {
      title, slug, excerpt: excerpt || null, content,
      coverImageUrl: coverUrl || null,
      category: category || null,
      tags, status, readTimeMinutes,
      metaTitle: metaTitle || null,
      metaDescription: metaDesc || null,
    }

    try {
      const res = await fetch(
        isEdit ? `/api/blog/posts/${initialData!.id}` : "/api/blog/posts",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      const data = await res.json()

      if (!res.ok) {
        setError(data.error?.formErrors?.[0] ?? JSON.stringify(data.error) ?? "Error al guardar")
        return
      }

      router.push("/editor/blog")
      router.refresh()
    } catch (e) {
      setError("Error de conexión")
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = async () => {
    if (!isEdit) return
    if (!confirm("¿Eliminar este artículo? Esta acción no se puede deshacer.")) return
    await fetch(`/api/blog/posts/${initialData!.id}`, { method: "DELETE" })
    router.push("/editor/blog")
    router.refresh()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Left: main content */}
      <div className="flex flex-col gap-5">
        {/* Title */}
        <div>
          <Input
            placeholder="Título del artículo"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-xl font-bold h-12 border-gray-200"
          />
        </div>

        {/* Slug */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 shrink-0">/blog/</span>
          <Input
            placeholder="url-del-articulo"
            value={slug}
            onChange={(e) => { setSlugManual(true); setSlug(slugify(e.target.value)) }}
            className="text-xs font-mono h-8 border-gray-200"
          />
        </div>

        {/* Excerpt */}
        <div>
          <textarea
            placeholder="Resumen del artículo (aparece en listados y SEO)..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 text-right">{excerpt.length}/500</p>
        </div>

        {/* Rich editor */}
        <RichEditor content={content} onChange={handleContentChange} />
      </div>

      {/* Right: sidebar */}
      <div className="flex flex-col gap-4">
        {/* Actions */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Publicación</p>

          <Button
            onClick={() => save("PUBLISHED")}
            disabled={!!saving || !title || !slug || !content}
            className="w-full bg-green-800 hover:bg-green-900 text-white gap-2"
          >
            {saving === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Publicar
          </Button>

          <Button
            variant="outline"
            onClick={() => save("DRAFT")}
            disabled={!!saving || !title || !slug}
            className="w-full gap-2"
          >
            {saving === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar borrador
          </Button>

          {isEdit && (
            <>
              <Button
                variant="outline"
                onClick={() => save("ARCHIVED")}
                disabled={!!saving}
                className="w-full gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <Archive className="h-4 w-4" />
                Archivar
              </Button>

              <Button
                variant="outline"
                onClick={handleDelete}
                className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </>
          )}

          {error && <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
        </div>

        {/* Cover image */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Imagen de portada</p>
          <Input
            placeholder="https://..."
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            className="text-xs"
          />
          {coverUrl && (
            <img src={coverUrl} alt="Cover preview" className="rounded-lg w-full object-cover aspect-video" onError={(e) => (e.currentTarget.style.display = "none")} />
          )}
        </div>

        {/* Category */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Categoría</p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="">Sin categoría</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Tags */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Tags</p>
          <Input
            placeholder="marketing, negocios, tips"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="text-xs"
          />
          <p className="text-[10px] text-gray-400">Separados por coma</p>
        </div>

        {/* SEO (collapsible) */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <button
            type="button"
            onClick={() => setSeoOpen(!seoOpen)}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wide text-gray-500"
          >
            SEO Avanzado
            <span>{seoOpen ? "▲" : "▼"}</span>
          </button>
          {seoOpen && (
            <div className="mt-3 flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Título SEO <span className="text-gray-300">({metaTitle.length}/70)</span></label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={70} placeholder={title} className="text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Descripción SEO <span className="text-gray-300">({metaDesc.length}/160)</span></label>
                <textarea
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value)}
                  maxLength={160}
                  rows={3}
                  placeholder={excerpt || "Descripción para buscadores..."}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Preview link */}
        {isEdit && initialData?.status === "PUBLISHED" && (
          <a
            href={`/blog/${initialData.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 transition-colors"
          >
            <Eye className="h-4 w-4" />
            Ver artículo publicado
          </a>
        )}
      </div>
    </div>
  )
}
