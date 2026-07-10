"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, X, Camera } from "@/lib/icons"

interface CategoryChild {
  id: string
  name: string
  slug: string
  icon?: string | null
}

interface Category {
  id: string
  name: string
  slug: string
  icon?: string | null
  children: CategoryChild[]
}

interface Municipality {
  id: string
  name: string
}

interface NewListingFormProps {
  categories: Category[]
  municipalities: Municipality[]
}

type ListingType = "SALE" | "PURCHASE" | "TRADE" | "SERVICE" | "REQUEST" | "EVENT" | "PROMOTION"

const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: "SALE", label: "Venta" },
  { value: "PURCHASE", label: "Compra" },
  { value: "TRADE", label: "Intercambio" },
  { value: "SERVICE", label: "Servicio" },
  { value: "REQUEST", label: "Solicitud" },
  { value: "EVENT", label: "Evento" },
  { value: "PROMOTION", label: "Promoción" },
]

export function NewListingForm({ categories, municipalities }: NewListingFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeParam = searchParams.get("type")
  const initialType: ListingType = LISTING_TYPES.some((t) => t.value === typeParam)
    ? (typeParam as ListingType)
    : "SALE"
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [selectedMunicipio, setSelectedMunicipio] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    type: initialType,
    neighborhood: "",
    phone: "",
    whatsapp: "",
    contactEmail: "",
  })

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCategoryChange = (v: string | null) => {
    if (v) {
      setSelectedCategory(v)
      setSelectedSubcategory("")
    }
  }

  const handleSubcategoryChange = (v: string | null) => {
    if (v) setSelectedSubcategory(v)
  }

  const handleMunicipioChange = (v: string | null) => {
    if (v) setSelectedMunicipio(v)
  }

  const handleTypeChange = (v: string | null) => {
    if (v) updateField("type", v)
  }

  // Sube cada archivo a R2 vía /api/upload y guarda la URL PERSISTENTE que
  // devuelve (antes se guardaba una URL blob: local a la pestaña, que se rompía
  // para todos los demás). Valida en cliente para fallar rápido y respeta el
  // tope de 10 imágenes del schema.
  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = "" // permite re-seleccionar el mismo archivo
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
        formData.append("folder", "marketplace")
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

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error("El título es requerido")
      return
    }
    if (!selectedCategory) {
      toast.error("Selecciona una categoría")
      return
    }
    if (uploadingImages) {
      toast.error("Espera a que terminen de subir las imágenes")
      return
    }

    setLoading(true)
    try {
      const body = {
        title: form.title,
        description: form.description,
        price: form.price ? parseFloat(form.price) : undefined,
        type: form.type,
        // Si hay subcategoría, se publica bajo ESA (más específica); si no, bajo
        // la padre. Antes se mandaba subcategoryId, que el API ignoraba → se perdía.
        categoryId: selectedSubcategory || selectedCategory,
        municipalityId: selectedMunicipio || undefined,
        neighborhood: form.neighborhood || undefined,
        phone: form.phone || undefined,
        whatsapp: form.whatsapp || undefined,
        contactEmail: form.contactEmail || undefined,
        images: images.length > 0 ? images.map((url, i) => ({ url, sortOrder: i })) : undefined,
      }

      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Error al crear publicación")
        return
      }

      toast.success("Publicación creada exitosamente")
      router.push("/marketplace")
      router.refresh()
    } catch {
      toast.error("Error al crear la publicación")
    } finally {
      setLoading(false)
    }
  }

  const currentCategory = categories.find((c) => c.id === selectedCategory)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Ej: Bicicleta de montaña en buen estado"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Categoría *</Label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon || ""} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={form.type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {LISTING_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {currentCategory && currentCategory.children.length > 0 && (
            <div>
              <Label htmlFor="subcategory">Subcategoría</Label>
              <Select value={selectedSubcategory} onValueChange={handleSubcategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar subcategoría" />
                </SelectTrigger>
                <SelectContent>
                  {currentCategory.children.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Describe tu publicación..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="price">Precio</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label>Imágenes</Label>
            <div className="flex flex-wrap gap-2 mb-2">
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

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="municipio">Municipio</Label>
              <Select value={selectedMunicipio} onValueChange={handleMunicipioChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar municipio" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="neighborhood">Colonia / Zona</Label>
              <Input
                id="neighborhood"
                value={form.neighborhood}
                onChange={(e) => updateField("neighborhood", e.target.value)}
                placeholder="Ej: Chapalita"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="3312345678"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(e) => updateField("whatsapp", e.target.value)}
                placeholder="3312345678"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contactEmail">Correo de contacto</Label>
            <Input
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(e) => updateField("contactEmail", e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || uploadingImages}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Publicar
        </Button>
      </div>
    </form>
  )
}
