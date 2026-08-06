"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Check, Store, MapPin, Clock, Phone, ChevronRightIcon, Gift } from "@/lib/icons"
import { GoogleMapPicker } from "@/components/business/google-map-picker"
import { AddressAutocomplete } from "@/components/business/address-autocomplete"
import { SuggestGiro } from "@/components/business/suggest-giro"
import { SERVICE_MODES } from "@/lib/profile-modality"

interface Municipality {
  id: string
  name: string
  neighborhoods: { id: string; name: string }[]
}

interface Category {
  id: string
  name: string
  icon?: string
  subcategories: { id: string; name: string; meta?: GiroMeta | null }[]
}

// Metadata del giro (del catálogo) que llega en cada subcategoría vía /api/categories.
type GiroMeta = {
  perfil?: string // "EMPRENDEDOR" | "NEGOCIO"
  modelo?: string // modelo de operación sugerido
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

export function BusinessRegistrationWizard({
  mapsApiKey = "",
  profileType: initialProfileType = "NEGOCIO",
  promoCoupons,
}: {
  mapsApiKey?: string
  profileType?: "EMPRENDEDOR" | "NEGOCIO"
  // Cupón de días gratis vigente por tipo de perfil (lo trae el server). Se
  // autocompleta al clasificar para que el alta active la prueba sin pago.
  promoCoupons?: {
    EMPRENDEDOR: { code: string; days: number } | null
    NEGOCIO: { code: string; days: number } | null
  }
}) {
  const router = useRouter()
  // El tipo de perfil ahora es ESTADO: lo auto-clasifica la pantalla de 3 preguntas
  // (modelo de operación) antes del wizard; el prop solo es el valor inicial.
  const [profileType, setProfileType] = useState<"EMPRENDEDOR" | "NEGOCIO">(initialProfileType)
  const [classified, setClassified] = useState(false)
  const [hasLocation, setHasLocation] = useState<boolean | null>(null)
  // El Emprendedor puede no tener local físico: la dirección exacta y el mapa
  // son opcionales; basta el municipio/zona base.
  const isEmprendedor = profileType === "EMPRENDEDOR"
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedMunicipio, setSelectedMunicipio] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [operationModel, setOperationModel] = useState("")
  const [serviceModes, setServiceModes] = useState<string[]>([])
  const [coverageArea, setCoverageArea] = useState("")
  const [invitationCode, setInvitationCode] = useState("")
  // Respuestas de la pantalla de clasificación (modelo de operación).
  const [q1, setQ1] = useState<string>("") // cómo ofrece: local|puesto|casa|domicilio|online
  const [q2, setQ2] = useState<boolean | null>(null) // ¿atiende en un lugar fijo?
  const [q3, setQ3] = useState<boolean | null>(null) // ¿tiene horarios?
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

  // Geocodifica el código postal y mueve el mapa/pin (además de la dirección).
  const geocodePostal = () => {
    const cp = form.postalCode.trim()
    if (!/^\d{5}$/.test(cp)) return
    const g = (window as any).google
    if (!g?.maps?.Geocoder) return
    new g.maps.Geocoder().geocode(
      { address: cp, componentRestrictions: { country: "MX" } },
      (res: any, status: string) => {
        if (status === "OK" && res?.[0]?.geometry?.location) {
          const loc = res[0].geometry.location
          setForm((p) => ({
            ...p,
            latitude: loc.lat().toFixed(6),
            longitude: loc.lng().toFixed(6),
            addressText: p.addressText || res[0].formatted_address || p.addressText,
          }))
        }
      },
    )
  }

  const handleCategoryChange = (v: string | null) => {
    if (v) { setSelectedCategory(v); setSelectedSubcategory("") }
  }

  const canProceed = () => {
    if (step === 1) return form.name.trim().length > 0
    if (step === 2) return form.phone.trim().length >= 10 && form.whatsapp.trim().length >= 10
    // Emprendedor: solo pide municipio/zona base (sin dirección exacta).
    // Negocio: dirección + municipio.
    if (step === 3) return isEmprendedor ? !!selectedMunicipio : form.addressText.trim().length > 0 && !!selectedMunicipio
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
        profileType,
        hasPhysicalLocation: hasLocation ?? !isEmprendedor,
        serviceModes,
        coverageArea: coverageArea || undefined,
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
        invitationCode: invitationCode.trim() || undefined,
        operationModel: operationModel.trim() || undefined,
        hours: hoursArray,
      }

      const planSlug = profileType === "EMPRENDEDOR" ? "emprendedor" : "negocio"

      if (invitationCode.trim()) {
        // CON cupón: se crea el negocio y se intenta canjear (activación inmediata,
        // sin pago). Camino de siempre.
        const res = await fetch("/api/business", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error(data.error || "Error al crear negocio")
          return
        }
        if (data.coupon?.applied) {
          toast.success(`¡Listo! Activaste ${data.coupon.planName} gratis por ${data.coupon.days} días.`)
          router.push("/dashboard/negocio")
          router.refresh()
        } else {
          // El código no aplicó: el negocio quedó registrado; se activa al pagar.
          toast.error(`El código no se aplicó: ${data.coupon?.error || "inválido"}. Completa tu pago para activarlo.`)
          router.push(`/checkout?plan=${planSlug}&businessId=${data.id}`)
        }
      } else {
        // SIN cupón (cliente real): NO se crea el negocio todavía. Se guarda el alta
        // en espera de pago y se va al checkout; el webhook lo crea al pagar.
        const res = await fetch("/api/business/pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, plan: planSlug }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error(data.error || "No se pudo continuar")
          return
        }
        router.push(`/checkout?plan=${planSlug}&pending=${data.id}`)
      }
    } catch {
      toast.error("Error al crear el negocio")
    } finally {
      setLoading(false)
    }
  }

  const currentCategory = categories.find((c) => c.id === selectedCategory)
  // Fase C — restricción por plan/perfil: solo se muestran los giros cuyo `perfil`
  // (del catálogo) coincide con el tipo elegido (Emprendedor/Negocio). Los giros sin
  // perfil definido se muestran siempre (salvaguarda).
  const girosForProfile = (currentCategory?.subcategories ?? []).filter(
    (s) => !s.meta?.perfil || s.meta.perfil === profileType,
  )
  const municipio = municipalities.find((m) => m.id === selectedMunicipio)

  // ── Clasificación por modelo de operación (Persona/Empresa) ──────────────────
  const Q1_OPTIONS = [
    { value: "local", label: "Tengo un establecimiento fijo", model: "Local comercial", loc: true },
    { value: "puesto", label: "Tengo un puesto fijo o semifijo", model: "Puesto fijo / semifijo", loc: true },
    { value: "casa", label: "Trabajo desde casa / por pedido", model: "Desde casa / sobre pedido", loc: false },
    { value: "domicilio", label: "Trabajo a domicilio", model: "A domicilio", loc: false },
    { value: "online", label: "Solo vendo por internet o redes", model: "En línea / redes", loc: false },
  ] as const

  const q1def = Q1_OPTIONS.find((o) => o.value === q1)
  const answered = q1 !== "" && q2 !== null && q3 !== null
  const suggestedType: "EMPRENDEDOR" | "NEGOCIO" =
    q1 === "local" || q1 === "puesto" || (q2 === true && q3 === true) ? "NEGOCIO" : "EMPRENDEDOR"
  const suggestedLocation = !!q1def?.loc || q2 === true
  const suggestedModel = q1def?.model ?? ""

  const confirmClassification = (type: "EMPRENDEDOR" | "NEGOCIO") => {
    setProfileType(type)
    setHasLocation(suggestedLocation)
    if (suggestedModel) setOperationModel(suggestedModel)
    // Autocompleta el cupón de la promo que corresponde al plan elegido, salvo que
    // la persona ya haya escrito un código propio. Así el alta activa la prueba de
    // 60 días sin que tengan que teclear nada.
    const promo = promoCoupons?.[type]
    if (promo && (!invitationCode.trim() || invitationCode === promoCoupons?.EMPRENDEDOR?.code || invitationCode === promoCoupons?.NEGOCIO?.code)) {
      setInvitationCode(promo.code)
    }
    setClassified(true)
  }

  if (!classified) {
    const OptBtn = ({
      active, onClick, children,
    }: { active: boolean; onClick: () => void; children: string }) => (
      <button
        type="button"
        onClick={onClick}
        className={`rounded-lg border-2 px-4 py-2.5 text-left text-sm transition-all ${
          active ? "border-[#006c49] bg-[#f0faf6] font-medium text-gray-900" : "border-gray-200 hover:border-[#006c49]/40"
        }`}
      >
        {children}
      </button>
    )
    return (
      <div className="rounded-xl border bg-white p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Cuéntanos cómo operas</h2>
          <p className="mt-1 text-sm text-gray-500">
            Con esto te registramos como <strong>Emprendedor</strong> o <strong>Negocio</strong>, lo que mejor te queda. Podrás cambiarlo.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="mb-2 block text-sm font-semibold text-gray-800">
              1. ¿Cómo ofreces tus productos o servicios?
            </Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {Q1_OPTIONS.map((o) => (
                <OptBtn key={o.value} active={q1 === o.value} onClick={() => setQ1(o.value)}>
                  {o.label}
                </OptBtn>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-semibold text-gray-800">
              2. ¿Atiendes al público en un lugar específico?
            </Label>
            <div className="flex gap-2">
              <OptBtn active={q2 === true} onClick={() => setQ2(true)}>Sí</OptBtn>
              <OptBtn active={q2 === false} onClick={() => setQ2(false)}>No</OptBtn>
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-semibold text-gray-800">
              3. ¿Tienes horarios de atención?
            </Label>
            <div className="flex gap-2">
              <OptBtn active={q3 === true} onClick={() => setQ3(true)}>Sí</OptBtn>
              <OptBtn active={q3 === false} onClick={() => setQ3(false)}>No</OptBtn>
            </div>
          </div>

          {answered && (
            <div className="rounded-xl border border-[#006c49]/20 bg-[#f5faf8] p-4">
              <p className="text-sm text-gray-700">
                Te sugerimos registrarte como{" "}
                <strong>{suggestedType === "EMPRENDEDOR" ? "Emprendedor" : "Negocio"}</strong>
                {suggestedModel ? (
                  <>
                    {" "}· modelo <strong>{suggestedModel}</strong>
                  </>
                ) : null}
                .
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => confirmClassification(suggestedType)}
                  className="bg-[#006c49] text-white hover:bg-[#00583b]"
                >
                  Continuar como {suggestedType === "EMPRENDEDOR" ? "Emprendedor" : "Negocio"}
                  <ChevronRightIcon className="ml-1.5 h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    confirmClassification(suggestedType === "EMPRENDEDOR" ? "NEGOCIO" : "EMPRENDEDOR")
                  }
                >
                  Prefiero {suggestedType === "EMPRENDEDOR" ? "Negocio" : "Emprendedor"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

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
        <div className="space-y-5">
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
            <SuggestGiro />
          </div>
          {currentCategory && girosForProfile.length > 0 && (
            <div>
              <Label htmlFor="subcategory">Giro (¿a qué te dedicas?)</Label>
              <Select
                value={selectedSubcategory}
                onValueChange={(v) => {
                  if (!v) return
                  setSelectedSubcategory(v)
                  // Al elegir el giro, pre-llena el modelo de operación sugerido del catálogo.
                  const sub = girosForProfile.find((s) => s.id === v)
                  if (sub?.meta?.modelo) setOperationModel(sub.meta.modelo)
                }}
                items={Object.fromEntries(girosForProfile.map((s) => [s.id, s.name]))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu giro" />
                </SelectTrigger>
                <SelectContent>
                  {girosForProfile.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sugerencia por modelo de operación (del catálogo) */}
              {(() => {
                const sub = currentCategory?.subcategories.find((s) => s.id === selectedSubcategory)
                const suggested = sub?.meta?.perfil // "EMPRENDEDOR" | "NEGOCIO"
                if (!suggested) return null
                const label = suggested === "EMPRENDEDOR" ? "Emprendedor" : "Negocio"
                const mismatch = suggested !== profileType
                return (
                  <div className="mt-2 space-y-2">
                    {mismatch && (
                      <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Este giro suele registrarse como <strong>{label}</strong>. Elegiste{" "}
                        {isEmprendedor ? "Emprendedor" : "Negocio"}; puedes continuar así o cambiarlo al inicio.
                      </p>
                    )}
                    <div>
                      <Label htmlFor="operationModel" className="text-xs text-gray-600">
                        Modelo de operación
                      </Label>
                      <Input
                        id="operationModel"
                        value={operationModel}
                        onChange={(e) => setOperationModel(e.target.value)}
                        placeholder="Ej: Local comercial, A domicilio, Sobre pedido…"
                      />
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
          {currentCategory && girosForProfile.length === 0 && (
            <p className="text-xs text-gray-500">
              Esta categoría no tiene giros para {isEmprendedor ? "Emprendedor" : "Negocio"}. Elige
              otra categoría, cambia tu tipo al inicio, o usa &ldquo;¿No encuentras tu giro?&rdquo;.
            </p>
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
        <div className="space-y-5">
          <h2 className="text-xl font-semibold">Información de contacto</h2>
          <div className="grid gap-5 sm:grid-cols-2">
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
          <div className="grid gap-5 sm:grid-cols-3">
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
        <div className="space-y-5">
          <h2 className="text-xl font-semibold">{isEmprendedor ? "Zona" : "Ubicación"}</h2>
          {isEmprendedor && (
            <p className="text-sm text-gray-500">
              Como emprendedor no necesitas local físico. Indica tu municipio y colonia base; la
              dirección exacta y el mapa son opcionales.
            </p>
          )}

          {isEmprendedor && (
            <div className="space-y-3 rounded-lg border border-green-100 bg-green-50/40 p-4">
              <div>
                <Label>¿Cómo vendes o atiendes?</Label>
                <p className="text-xs text-gray-500">Elige una o varias.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {SERVICE_MODES.map((m) => {
                  const checked = serviceModes.includes(m.code)
                  return (
                    <label
                      key={m.code}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        checked ? "border-green-500 bg-white" : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setServiceModes((prev) =>
                            prev.includes(m.code) ? prev.filter((c) => c !== m.code) : [...prev, m.code]
                          )
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      {m.label}
                    </label>
                  )
                })}
              </div>
              <div>
                <Label htmlFor="coverageArea">Zona de entrega / cobertura</Label>
                <Input
                  id="coverageArea"
                  value={coverageArea}
                  onChange={(e) => setCoverageArea(e.target.value)}
                  placeholder="Ej: Zapopan, Chapalita y colonias cercanas"
                />
              </div>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
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
            <Label htmlFor="addressText">{isEmprendedor ? "Dirección (opcional)" : "Dirección *"}</Label>
            <AddressAutocomplete
              id="addressText"
              apiKey={mapsApiKey}
              value={form.addressText}
              onChange={(v) => updateField("addressText", v)}
              onPlace={(d) =>
                setForm((p) => ({
                  ...p,
                  addressText: d.address,
                  latitude: d.lat.toFixed(6),
                  longitude: d.lng.toFixed(6),
                }))
              }
              placeholder="Empieza a escribir tu dirección…"
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            />
          </div>
          <div>
            <Label>Ubicación en el mapa</Label>
            <GoogleMapPicker
              apiKey={mapsApiKey}
              lat={form.latitude ? parseFloat(form.latitude) : null}
              lng={form.longitude ? parseFloat(form.longitude) : null}
              onChange={(la, lo) =>
                setForm((p) => ({ ...p, latitude: la.toFixed(6), longitude: lo.toFixed(6) }))
              }
              onAddress={(a) => setForm((p) => ({ ...p, addressText: a }))}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input id="postalCode" value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} onBlur={geocodePostal} inputMode="numeric" maxLength={5} placeholder="45138" />
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
        <div className="space-y-5">
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

      {/* Código de invitación (promo días gratis) — último paso */}
      {step === 4 && (() => {
        const planLabel = profileType === "EMPRENDEDOR" ? "Emprendedor" : "Negocio"
        const promo = promoCoupons?.[profileType] ?? null
        const promoApplied = !!promo && invitationCode.trim().toUpperCase() === promo.code
        return (
          <div className="mt-6 rounded-xl border border-[#006c49]/20 bg-[#f5faf8] p-4">
            {promoApplied ? (
              <>
                <div className="flex items-start gap-2.5">
                  <Gift className="mt-0.5 h-5 w-5 shrink-0 text-[#006c49]" />
                  <div>
                    <p className="text-sm font-semibold text-[#00583b]">
                      {promo!.days} días gratis aplicados para tu plan {planLabel}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-600">
                      Se activará con el código{" "}
                      <strong className="font-mono">{promo!.code}</strong> al registrarte — no pagas
                      los primeros {promo!.days} días. Después podrás renovar con pago.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInvitationCode("")}
                  className="mt-2 text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-gray-700"
                >
                  Quitar código
                </button>
              </>
            ) : (
              <>
                <Label htmlFor="invitationCode" className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                  ¿Tienes un código de invitación?
                </Label>
                <p className="mt-0.5 mb-2 text-xs text-gray-500">
                  Actívalo aquí y prueba tu plan {planLabel} <strong>gratis</strong>, sin pagar. Es
                  opcional; si no tienes, puedes canjearlo después en tu panel.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id="invitationCode"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                    placeholder="CÓDIGO (opcional)"
                    autoCapitalize="characters"
                    className="max-w-xs uppercase"
                  />
                  {promo && (
                    <button
                      type="button"
                      onClick={() => setInvitationCode(promo.code)}
                      className="rounded-lg bg-[#006c49] px-3 py-2 text-xs font-semibold text-white hover:bg-[#00583b]"
                    >
                      Aplicar {promo.days} días gratis
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )
      })()}

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
