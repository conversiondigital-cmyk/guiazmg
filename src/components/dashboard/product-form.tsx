"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, X, Camera } from "@/lib/icons"

export interface EditProduct {
  id: string
  title: string
  description: string | null
  price: number | null
  images: string[]
}

export function ProductForm({ product }: { product?: EditProduct }) {
  const router = useRouter()
  const isEdit = !!product

  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [form, setForm] = useState({
    title: product?.title ?? "",
    description: product?.description ?? "",
    price: product?.price != null ? String(product.price) : "",
  })

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  // Sube cada archivo a R2 vía /api/upload y guarda la URL persistente. Igual que
  // en marketplace: valida en cliente y respeta el tope de 10 imágenes.
  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ""
    if (!files.length) return

    const room = 10 - images.length
    if (room <= 0) {
      toast.error("Máximo 10 imágenes")
      return
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    setUploadingImages(true)
    try {
      for (const file of files.slice(0, room)) {
        if (!allowed.includes(file.type)) {
          toast.error(`${file.name}: usa JPG, PNG, WebP o GIF`)
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: máximo 5MB`)
          continue
        }
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "listing")
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || `No se pudo subir ${file.name}`)
          continue
        }
        setImages((prev) => [...prev, data.url])
      }
      if (files.length > room) {
        toast.error("Solo se permiten 10 imágenes; algunas no se agregaron")
      }
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error("El nombre del producto es requerido")
      return
    }
    if (uploadingImages) {
      toast.error("Espera a que terminen de subir las imágenes")
      return
    }
    // Precio opcional; si se escribe, debe ser un número válido ≥ 0.
    let price: number | null = null
    if (form.price.trim()) {
      const n = parseFloat(form.price)
      if (Number.isNaN(n) || n < 0) {
        toast.error("El precio no es válido")
        return
      }
      price = n
    }

    setLoading(true)
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        price,
        images,
      }
      const res = await fetch(isEdit ? `/api/listings/${product!.id}` : "/api/listings", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Error al guardar el producto")
        return
      }
      toast.success(isEdit ? "Producto actualizado" : "Producto agregado")
      router.push("/dashboard/productos")
      router.refresh()
    } catch {
      toast.error("Error al guardar el producto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label htmlFor="title">Nombre del producto *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Ej: Manzana roja (kg)"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Detalles, presentación, disponibilidad…"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="price">Precio (MXN)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              placeholder="Ej: 35"
            />
            <p className="mt-1 text-xs text-gray-500">
              Opcional. Déjalo vacío si el precio es variable o &ldquo;a preguntar&rdquo;.
            </p>
          </div>

          <div>
            <Label>Fotos</Label>
            <div className="mb-2 flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border">
                  <Image src={url} alt="" fill className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Label
                htmlFor="images"
                aria-disabled={uploadingImages}
                className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 aria-disabled:pointer-events-none aria-disabled:opacity-60"
              >
                {uploadingImages ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                <span className="mt-1 text-[10px]">{uploadingImages ? "Subiendo…" : "Agregar"}</span>
              </Label>
              <input
                id="images"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleImages}
                disabled={uploadingImages}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || uploadingImages}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isEdit ? "Guardar cambios" : "Agregar producto"}
        </Button>
      </div>
    </form>
  )
}
