"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Check, Store, MapPin, Clock, Phone, ChevronRightIcon } from "@/lib/icons"

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

interface DayHour {
  isClosed: boolean
  openTime: string
  closeTime: string
}

const DAYS = [
  { key: 0, label: "Domingo" },
  { key: 1, label: "Lunes" },
  { key: 2, label: "Martes" },
  { key: 3, label: "Miércoles" },
  { key: 4, label: "Jueves" },
  { key: 5, label: "Viernes" },
  { key: 6, label: "Sábado" },
]

const steps = [
  { id: 1, label: "Información básica", icon: Store },
  { id: 2, label: "Contacto", icon: Phone },
  { id: 3, label: "Ubicación", icon: MapPin },
  { id: 4, label: "Horarios", icon: Clock },
]

export function BusinessRegistrationWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedMunicipio, setSelectedMunicipio] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [hours, setHours] = useState<Record<number, DayHour>>(
    Object.fromEntries(DAYS.map((d) => [d.key, { isClosed: false, openTime: "09:00", closeTime: "18:00" }]))
  )

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

  const handleCategoryChange = (v: string | null) => {
    if (v) { setSelectedCategory(v); setSelectedSubcategory("") }
  }

  const canProceed = () => {
    if (step === 1) return form.name.trim().length > 0
    if (step === 2) return form.phone.trim().length >= 10 && form.whatsapp.trim().length >= 10
    if (step === 3) return form.addressText.trim().length > 0 && !!selectedMunicipio
    return true
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const hoursArray = Object.entries(hours)
        .filter(([, h]) => !h.isClosed)
        .map(([day, h]) => ({
          dayOfWeek: parseInt(day),
          opensAt: h.openTime,
          closesAt: h.closeTime,
        }))

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
        hours: hoursArray,
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
    <div className="rounded-xl border bg-white p-6 sm:p-8">
      {/* Steps indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  step === s.id
                    ? "bg-green-700 text-white"
                    : step > s.id
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {step > s.id ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`hidden sm:block mx-2 h-0.5 w-12 lg:w-20 ${
                    step > s.id ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 hidden sm:flex justify-between text-xs text-gray-500">
          {steps.map((s) => (
            <span key={s.id} className={step === s.id ? "font-medium text-green-700" : ""}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Información básica</h2>
          <div>
            <Label htmlFor="name">Nombre del negocio *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Ej: Taller Mecánico El Chaparral"
              required
            />
          </div>
          <div>
            <Label htmlFor="shortDescription">Descripción corta</Label>
            <Input
              id="shortDescription"
              value={form.shortDescription}
              onChange={(e) => updateField("shortDescription", e.target.value)}
              placeholder="Breve descripción (máx 200 caracteres)"
              maxLength={200}
            />
          </div>
          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select value={selectedCategory} onValueChange={handleCategoryChange} items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}>
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
          {currentCategory && currentCategory.subcategories.length > 0 && (
            <div>
              <Label htmlFor="subcategory">Subcategoría</Label>
              <Select value={selectedSubcategory} onValueChange={(v) => v && setSelectedSubcategory(v)} items={Object.fromEntries((currentCategory?.subcategories ?? []).map((s) => [s.id, s.name]))}>
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
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Describe tu negocio, servicios, horarios..."
              rows={4}
            />
          </div>
        </div>
      )}

      {/* Step 2: Contact */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Información de contacto</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Teléfono *</Label>
              <Input id="phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="3312345678" required />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input id="whatsapp" value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="3312345678" required />
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
        </div>
      )}

      {/* Step 3: Location */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Ubicación</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="municipio">Municipio *</Label>
              <Select value={selectedMunicipio} onValueChange={(v) => v && setSelectedMunicipio(v)} items={Object.fromEntries(municipalities.map((m) => [m.id, m.name]))}>
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
                <Select value={form.neighborhoodId} onValueChange={(v) => v && updateField("neighborhoodId", v)} items={Object.fromEntries((municipio?.neighborhoods ?? []).map((n) => [n.id, n.name]))}>
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
            <Label htmlFor="addressText">Dirección *</Label>
            <Input id="addressText" value={form.addressText} onChange={(e) => updateField("addressText", e.target.value)} placeholder="Calle y número, Colonia" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input id="postalCode" value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="latitude">Latitud</Label>
              <Input id="latitude" type="number" step="any" value={form.latitude} onChange={(e) => updateField("latitude", e.target.value)} placeholder="20.6597" />
            </div>
            <div>
              <Label htmlFor="longitude">Longitud</Label>
              <Input id="longitude" type="number" step="any" value={form.longitude} onChange={(e) => updateField("longitude", e.target.value)} placeholder="-103.3496" />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Hours */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Horarios</h2>
          <p className="text-sm text-gray-500">Define los horarios de atención de tu negocio</p>
          <div className="space-y-3">
            {DAYS.map((day) => {
              const h = hours[day.key]
              return (
                <div key={day.key} className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`closed-${day.key}`}
                      checked={h.isClosed}
                      onChange={(e) =>
                        setHours((prev) => ({
                          ...prev,
                          [day.key]: { ...prev[day.key], isClosed: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor={`closed-${day.key}`} className="text-sm text-gray-500 cursor-pointer">
                      Cerrado
                    </Label>
                  </div>
                  <span className="w-20 text-sm font-medium">{day.label}</span>
                  {!h.isClosed && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={h.openTime}
                        onChange={(e) =>
                          setHours((prev) => ({
                            ...prev,
                            [day.key]: { ...prev[day.key], openTime: e.target.value },
                          }))
                        }
                        className="w-32"
                      />
                      <span className="text-gray-400">a</span>
                      <Input
                        type="time"
                        value={h.closeTime}
                        onChange={(e) =>
                          setHours((prev) => ({
                            ...prev,
                            [day.key]: { ...prev[day.key], closeTime: e.target.value },
                          }))
                        }
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => step > 1 ? setStep(step - 1) : router.back()}
        >
          {step > 1 ? "Anterior" : "Cancelar"}
        </Button>

        {step < 4 ? (
          <Button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()}>
            Siguiente
            <ChevronRightIcon className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar negocio
          </Button>
        )}
      </div>
    </div>
  )
}
