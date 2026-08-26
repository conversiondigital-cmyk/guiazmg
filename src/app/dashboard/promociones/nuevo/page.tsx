"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import NextImage from "next/image"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, Upload, Trash2, Camera } from "@/lib/icons"

export default function NewPromocionPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    code: "",
    startDate: "",
    endDate: "",
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      toast.error("Usa una imagen JPG, PNG, WebP o GIF")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe pesar más de 5MB")
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "promotions")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "No se pudo subir la imagen")
        return
      }
      setForm((f) => ({ ...f, imageUrl: data.url }))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.code) return
    setSaving(true)
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        router.push("/dashboard/promociones")
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "No se pudo crear la promoción")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Promoción</h1>
        <p className="text-gray-500">Crea un cupón o promoción para tu negocio</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Datos de la promoción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: 20% de descuento en servicios" />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe los términos de la promoción" />
            </div>

            {/* Imagen promocional (opcional) */}
            <div>
              <Label>Imagen promocional <span className="font-normal text-gray-400">(opcional)</span></Label>
              <p className="mb-2 text-xs text-gray-500">
                Sube una imagen alusiva a tu promoción. Se muestra en tu perfil junto al cupón. Máximo 5MB.
              </p>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                  {form.imageUrl ? (
                    <NextImage src={form.imageUrl} alt="Vista previa" fill className="object-cover" sizes="96px" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <Camera className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {form.imageUrl ? "Cambiar imagen" : "Subir imagen"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                  {form.imageUrl && (
                    <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}>
                      <Trash2 className="mr-1 h-4 w-4" />
                      Quitar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="code">Código *</Label>
                <Input id="code" value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="VERANO2026" />
              </div>
              <div>
                <Label htmlFor="startDate">Inicio</Label>
                <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="endDate">Fin</Label>
                <Input id="endDate" type="date" value={form.endDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving || uploading || !form.title || !form.code}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Crear promoción
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
