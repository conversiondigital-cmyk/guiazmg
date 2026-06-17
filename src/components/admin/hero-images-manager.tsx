"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Upload, Trash2, ArrowUp, ArrowDown, Loader2, Images } from "lucide-react"
import { confirmDialog } from "@/components/ui/system-dialog"

export function HeroImagesManager({ initialImages }: { initialImages: string[] }) {
  const router = useRouter()
  const [images, setImages] = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onFiles(files: FileList | null) {
    if (!files || !files.length) return
    setUploading(true)
    try {
      let latest = images
      let ok = 0
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/admin/hero", { method: "POST", body: fd })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error(data.error ?? `No se pudo subir ${file.name}`)
          continue
        }
        latest = data.images
        ok++
      }
      setImages(latest)
      if (ok) toast.success(`${ok} imagen${ok !== 1 ? "es" : ""} agregada${ok !== 1 ? "s" : ""}`)
      router.refresh()
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function persist(next: string[]) {
    setImages(next)
    const res = await fetch("/api/admin/hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: next }),
    })
    if (!res.ok) toast.error("No se pudo guardar el orden")
    router.refresh()
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= images.length) return
    const next = [...images]
    ;[next[i], next[j]] = [next[j], next[i]]
    persist(next)
  }

  async function remove(url: string) {
    if (!(await confirmDialog({
      title: "Eliminar imagen",
      description: "¿Quitar esta imagen del carrusel del inicio?",
      destructive: true,
    }))) return
    const res = await fetch("/api/admin/hero", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setImages(data.images)
      toast.success("Imagen eliminada")
      router.refresh()
    } else {
      toast.error(data.error ?? "No se pudo eliminar")
    }
  }

  return (
    <div className="space-y-6">
      {/* Uploader */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition-colors hover:border-green-600 hover:bg-green-50 disabled:opacity-60"
      >
        {uploading ? (
          <Loader2 className="h-7 w-7 animate-spin text-green-700" />
        ) : (
          <Upload className="h-7 w-7 text-green-700" />
        )}
        <span className="text-sm font-semibold text-gray-900">
          {uploading ? "Subiendo..." : "Subir imágenes"}
        </span>
        <span className="text-xs text-gray-500">JPG, PNG, WebP o GIF · hasta 8MB · puedes seleccionar varias</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />

      {/* Lista */}
      {images.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center">
          <Images className="mx-auto h-9 w-9 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">
            Aún no hay imágenes. Sube algunas y aparecerán en el carrusel del hero de la página
            principal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((url, i) => (
            <div key={url} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="relative aspect-[16/9] bg-gray-100">
                <img src={url} alt={`Hero ${i + 1}`} className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, -1)} title="Subir">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" disabled={i === images.length - 1} onClick={() => move(i, 1)} title="Bajar">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => remove(url)} title="Eliminar">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Las imágenes se muestran en carrusel detrás de un degradado verde semitransparente, para que
        el título y el buscador del inicio sigan siendo legibles. El orden de arriba es el orden del
        carrusel.
      </p>
    </div>
  )
}
