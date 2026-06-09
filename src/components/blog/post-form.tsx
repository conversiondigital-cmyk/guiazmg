"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { RichEditor } from "./rich-editor"
import { Save, Eye, Globe, Archive, Loader2, Trash2, Send, ImageUp, X } from "lucide-react"
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
  const words = html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

type SaveAction = "draft" | "submit" | "publish" | "archive" | null

export interface PostFormInitialData {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImageUrl: string | null
  category: string | null
  tags: string[]
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED"
  readTimeMinutes: number
  metaTitle: string | null
  metaDescription: string | null
  rejectionReason?: string | null
}

interface PostFormProps {
  initialData?: PostFormInitialData
  isAdmin?: boolean
}

export function PostForm({ initialData, isAdmin = false }: PostFormProps) {
  const router = useRouter()
  const isEdit = !!initialData
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [title,      setTitle]     = useState(initialData?.title ?? "")
  const [slug,       setSlug]      = useState(initialData?.slug  ?? "")
  const [excerpt,    setExcerpt]   = useState(initialData?.excerpt ?? "")
  const [content,    setContent]   = useState(initialData?.content ?? "")
  const [coverUrl,   setCoverUrl]  = useState(initialData?.coverImageUrl ?? "")
  const [category,   setCategory]  = useState(initialData?.category ?? "")
  const [tagsInput,  setTagsInput] = useState((initialData?.tags ?? []).join(", "))
  const [metaTitle,  setMetaTitle] = useState(initialData?.metaTitle ?? "")
  const [metaDesc,   setMetaDesc]  = useState(initialData?.metaDescription ?? "")
  const [slugManual, setSlugManual] = useState(isEdit)
  const [saving,     setSaving]    = useState<SaveAction>(null)
  const [error,      setError]     = useState("")
  const [seoOpen,    setSeoOpen]   = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)

  const handleTitleChange = (v: string) => {
    setTitle(v)
    if (!slugManual) setSlug(slugify(v))
  }

  const handleContentChange = useCallback((html: string) => setContent(html), [])

  // Upload cover image to R2
  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "blog/covers")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al subir")
      setCoverUrl(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir portada")
    } finally {
      setCoverUploading(false)
    }
  }

  const callApi = async (targetStatus: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED") => {
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
    const readTimeMinutes = estimateReadTime(content)

    const body = {
      title, slug,
      excerpt:         excerpt || null,
      content,
      coverImageUrl:   coverUrl || null,
      category:        category || null,
      tags, status: targetStatus, readTimeMinutes,
      metaTitle:       metaTitle || null,
      metaDescription: metaDesc  || null,
    }

    const res = await fetch(
      isEdit ? `/api/blog/posts/${initialData!.id}` : "/api/blog/posts",
      {
        method:  isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      }
    )
    return res
  }

  const callModerate = async (action: string, reason?: string) => {
    return fetch(`/api/blog/posts/${initialData!.id}/moderate`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action, reason }),
    })
  }

  const save = async (action: SaveAction) => {
    setError("")
    setSaving(action)

    try {
      let res: Response

      if (action === "draft") {
        res = await callApi("DRAFT")
      } else if (action === "submit") {
        // Save first, then submit for review
        if (!isEdit) {
          res = await callApi("PENDING_REVIEW")
        } else {
          res = await callApi("DRAFT") // save changes
          if (res.ok) res = await callModerate("submit")
        }
      } else if (action === "publish" && isAdmin) {
        if (isEdit) {
          await callApi("DRAFT") // save content
          res = await callModerate("approve")
        } else {
          res = await callApi("PUBLISHED" as any)
        }
      } else if (action === "archive") {
        res = await callModerate("archive")
      } else {
        res = await callApi("DRAFT")
      }

      const data = await res!.json()
      if (!res!.ok) {
        setError(data.error?.formErrors?.[0] ?? JSON.stringify(data.error ?? data) ?? "Error al guardar")
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
    if (!isEdit || !confirm("¿Eliminar este artículo?")) return
    await fetch(`/api/blog/posts/${initialData!.id}`, { method: "DELETE" })
    router.push("/editor/blog")
    router.refresh()
  }

  const canPublishDirectly = isAdmin
  const isPublished = initialData?.status === "PUBLISHED"
  const isRejected  = initialData?.status === "REJECTED"
  const isPending   = initialData?.status === "PENDING_REVIEW"

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Left */}
      <div className="flex flex-col gap-5">

        {/* Rejection notice */}
        {isRejected && initialData?.rejectionReason && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-800 mb-1">Artículo rechazado</p>
            <p className="text-sm text-red-700">{initialData.rejectionReason}</p>
            <p className="text-xs text-red-500 mt-2">Corrige el artículo y envíalo nuevamente a revisión.</p>
          </div>
        )}

        {isPending && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-800">En revisión</p>
            <p className="text-xs text-amber-600 mt-1">Este artículo está esperando aprobación de un administrador.</p>
          </div>
        )}

        {/* Title */}
        <Input
          placeholder="Título del artículo"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-xl font-bold h-12 border-gray-200"
        />

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
            placeholder="Resumen (aparece en listados y SEO)..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <p className="text-xs text-gray-400 text-right">{excerpt.length}/500</p>
        </div>

        {/* Rich editor */}
        <RichEditor content={content} onChange={handleContentChange} />
      </div>

      {/* Right sidebar */}
      <div className="flex flex-col gap-4">

        {/* Actions */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Publicación</p>

          {/* Admin: publish directly */}
          {canPublishDirectly && (
            <Button
              onClick={() => save("publish")}
              disabled={!!saving || !title || !slug || !content}
              className="w-full bg-green-800 hover:bg-green-900 text-white gap-2"
            >
              {saving === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              Publicar
            </Button>
          )}

          {/* Editor: send to review */}
          {!canPublishDirectly && (
            <Button
              onClick={() => save("submit")}
              disabled={!!saving || !title || !slug || !content || isPending}
              className="w-full bg-green-800 hover:bg-green-900 text-white gap-2"
            >
              {saving === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isPending ? "En revisión..." : "Enviar a revisión"}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => save("draft")}
            disabled={!!saving || !title || !slug}
            className="w-full gap-2"
          >
            {saving === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar borrador
          </Button>

          {isEdit && (
            <>
              {(isAdmin || isPublished) && (
                <Button
                  variant="outline"
                  onClick={() => save("archive")}
                  disabled={!!saving}
                  className="w-full gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  <Archive className="h-4 w-4" />
                  Archivar
                </Button>
              )}
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

        {/* Cover image — upload to R2 */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Imagen de portada</p>
          <p className="text-[10px] text-gray-400">Se sube a Cloudflare R2. Formato: JPG, PNG, WebP (max 5MB)</p>

          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = "" }}
          />

          {coverUrl ? (
            <div className="relative">
              <img src={coverUrl} alt="Portada" className="rounded-lg w-full object-cover aspect-video" />
              <button
                type="button"
                onClick={() => setCoverUrl("")}
                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-gray-600 hover:bg-white shadow-sm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-6 text-center hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              {coverUploading
                ? <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                : <ImageUp className="h-6 w-6 text-gray-400" />
              }
              <span className="text-xs text-gray-500">
                {coverUploading ? "Subiendo..." : "Haz clic o arrastra una imagen"}
              </span>
            </button>
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
          {tagsInput && (
            <div className="flex flex-wrap gap-1">
              {tagsInput.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                <span key={tag} className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* SEO */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <button
            type="button"
            onClick={() => setSeoOpen(!seoOpen)}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wide text-gray-500"
          >
            SEO Avanzado
            <span className="text-gray-400">{seoOpen ? "▲" : "▼"}</span>
          </button>
          {seoOpen && (
            <div className="mt-3 flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">
                  Meta Título <span className="text-gray-300">({metaTitle.length}/70)</span>
                </label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={70} placeholder={title} className="text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">
                  Meta Descripción <span className="text-gray-300">({metaDesc.length}/160)</span>
                </label>
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

        {/* View live */}
        {isEdit && isPublished && (
          <a
            href={`/blog/${initialData!.slug}`}
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
