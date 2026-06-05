"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "@/lib/icons"

interface Municipality {
  id: string
  name: string
  neighborhoods: { id: string; name: string }[]
}

interface Category {
  id: string
  name: string
  icon?: string
  subcategories: { id: string; name: string }[]
}

export function BusinessForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedMunicipio, setSelectedMunicipio] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const handleMunicipioChange = (v: string | null) => v && setSelectedMunicipio(v)
  const handleCategoryChange = (v: string | null) => { if (v) { setSelectedCategory(v); setSelectedSubcategory("") } }
  const handleSubcategoryChange = (v: string | null) => v && setSelectedSubcategory(v)
  const handleNeighborhoodChange = (v: string | null) => v && updateField("neighborhoodId", v)

  const [form, setForm] = useState({
    name: "",
    description: "",
    shortDescription: "",
    email: "",
    phone: "",
    whatsapp: "",
    websiteUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
    googleMapsUrl: "",
    wazeUrl: "",
    addressText: "",
    neighborhoodId: "",
    postalCode: "",
    latitude: "",
    longitude: "",
  })

  useEffect(() => {
    fetch("/api/municipalities").then((r) => r.json()).then(setMunicipalities)
    fetch("/api/categories").then((r) => r.json()).then(setCategories)
  }, [])

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error("El nombre del negocio es requerido")
      return
    }

    setLoading(true)
    try {
      const body = {
        name: form.name,
        description: form.description,
        shortDescription: form.shortDescription,
        email: form.email,
        phone: form.phone,
        whatsapp: form.whatsapp,
        websiteUrl: form.websiteUrl || undefined,
        facebookUrl: form.facebookUrl || undefined,
        instagramUrl: form.instagramUrl || undefined,
        tiktokUrl: form.tiktokUrl || undefined,
        googleMapsUrl: form.googleMapsUrl || undefined,
        wazeUrl: form.wazeUrl || undefined,
        addressText: form.addressText || undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        municipalityId: selectedMunicipio || undefined,
        neighborhoodId: form.neighborhoodId || undefined,
        categoryId: selectedCategory || undefined,
        subcategoryId: selectedSubcategory || undefined,
        postalCode: form.postalCode || undefined,
      }

      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Error al crear negocio")
        return
      }

      toast.success("Negocio creado exitosamente")
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Error al crear el negocio")
    } finally {
      setLoading(false)
    }
  }

  const currentCategory = categories.find((c) => c.id === selectedCategory)
  const municipio = municipalities.find((m) => m.id === selectedMunicipio)

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Información básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre del negocio *</Label>
            <Input id="name" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Ej: Taller Mecánico El Chaparral" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="shortDescription">Descripción corta</Label>
              <Input id="shortDescription" value={form.shortDescription} onChange={(e) => updateField("shortDescription", e.target.value)} placeholder="Breve descripción (máx 200 caracteres)" maxLength={200} />
            </div>
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.icon || ""} {cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {currentCategory && currentCategory.subcategories.length > 0 && (
            <div>
              <Label htmlFor="subcategory">Subcategoría</Label>
              <Select value={selectedSubcategory} onValueChange={handleSubcategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar subcategoría" />
                </SelectTrigger>
                <SelectContent>
                  {currentCategory.subcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="description">Descripción completa</Label>
            <Textarea id="description" value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Describe tu negocio, servicios, horarios..." rows={4} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="3312345678" />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="3312345678" />
            </div>
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <Label htmlFor="websiteUrl">Sitio web</Label>
              <Input id="websiteUrl" value={form.websiteUrl} onChange={(e) => updateField("websiteUrl", e.target.value)} placeholder="https://ejemplo.com" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="facebookUrl">Facebook</Label>
              <Input id="facebookUrl" value={form.facebookUrl} onChange={(e) => updateField("facebookUrl", e.target.value)} placeholder="URL de Facebook" />
            </div>
            <div>
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input id="instagramUrl" value={form.instagramUrl} onChange={(e) => updateField("instagramUrl", e.target.value)} placeholder="URL de Instagram" />
            </div>
            <div>
              <Label htmlFor="tiktokUrl">TikTok</Label>
              <Input id="tiktokUrl" value={form.tiktokUrl} onChange={(e) => updateField("tiktokUrl", e.target.value)} placeholder="URL de TikTok" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
              <Input id="googleMapsUrl" value={form.googleMapsUrl} onChange={(e) => updateField("googleMapsUrl", e.target.value)} placeholder="https://maps.app.goo.gl/..." />
            </div>
            <div>
              <Label htmlFor="wazeUrl">Waze URL</Label>
              <Input id="wazeUrl" value={form.wazeUrl} onChange={(e) => updateField("wazeUrl", e.target.value)} placeholder="https://waze.com/..." />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubicación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            {municipio && municipio.neighborhoods.length > 0 && (
              <div>
                <Label htmlFor="neighborhood">Colonia</Label>
                <Select value={form.neighborhoodId} onValueChange={handleNeighborhoodChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar colonia" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipio.neighborhoods.map((n) => (
                      <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="addressText">Dirección</Label>
            <Input id="addressText" value={form.addressText} onChange={(e) => updateField("addressText", e.target.value)} placeholder="Calle y número, Colonia" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input id="postalCode" value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} />
            </div>
            <div />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="latitude">Latitud</Label>
              <Input id="latitude" type="number" step="any" value={form.latitude} onChange={(e) => updateField("latitude", e.target.value)} placeholder="20.6597" />
            </div>
            <div>
              <Label htmlFor="longitude">Longitud</Label>
              <Input id="longitude" type="number" step="any" value={form.longitude} onChange={(e) => updateField("longitude", e.target.value)} placeholder="-103.3496" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Guardar negocio
        </Button>
      </div>
    </form>
  )
}
