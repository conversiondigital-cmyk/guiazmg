"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Check, Store, MapPin, Clock, Phone, ChevronRightIcon, ChevronDown, Gift } from "@/lib/icons"
import { Home, Globe, Bike, Tent, Sparkles, Search } from "lucide-react"
import { GoogleMapPicker } from "@/components/business/google-map-picker"
import { AddressAutocomplete } from "@/components/business/address-autocomplete"
import { SuggestGiro } from "@/components/business/suggest-giro"
import { SERVICE_MODES } from "@/lib/profile-modality"
import { normalizeName, parseAddressComponents, type ResolvedPlace } from "@/lib/geo/parse-address"

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
  keywords?: string // términos de búsqueda del catálogo (coma-separados)
  sinonimos?: string // sinónimos del giro (coma-separados)
}

// El catálogo guarda el perfil CAPITALIZADO ("Emprendedor"/"Negocio"), pero
// profileType es "EMPRENDEDOR"/"NEGOCIO". Se normaliza a mayúsculas para comparar
// (sin esto, ninguna comparación hacía match y solo se veían los giros sin perfil).
function perfilOf(meta?: GiroMeta | null): "EMPRENDEDOR" | "NEGOCIO" | "" {
  const p = meta?.perfil?.toUpperCase()
  return p === "EMPRENDEDOR" || p === "NEGOCIO" ? p : ""
}

// ── Búsqueda y detección automática de giro ─────────────────────────────────
// Normaliza texto: minúsculas, sin acentos, solo alfanumérico + espacios.
function normalizeSearch(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Palabras vacías del español + genéricas de negocio, para que la detección no
// se dispare con "de", "para", "negocio", "vendo"…
const STOPWORDS = new Set(
  "de la el los las un una unos unas y o u en para por con del al se su sus mi tu que a e como mas muy sin lo le les nos me te ya son est esta este estos estas hay tengo tenemos hago hacemos vendo vendemos ofrezco ofrecemos negocio negocios servicio servicios producto productos venta ventas tienda local marca empresa mejor calidad precio precios".split(
    " ",
  ),
)

// Divide un texto en tokens significativos (>=3 letras, sin stopwords).
function tokenize(s: string): string[] {
  return normalizeSearch(s)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
}

type GiroIndexEntry = {
  catId: string
  catName: string
  catIcon?: string
  sub: { id: string; name: string; meta?: GiroMeta | null }
  name: string // nombre del giro normalizado
  haystack: string // nombre + categoría + keywords + sinónimos (para el buscador)
  kwTokens: Set<string> // tokens de nombre/keywords/sinónimos (para la detección)
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
  const [catsLoading, setCatsLoading] = useState(true)
  const [selectedMunicipio, setSelectedMunicipio] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [openCat, setOpenCat] = useState("") // categoría expandida en el acordeón
  const [giroQuery, setGiroQuery] = useState("") // texto del buscador de giro
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
    fetch("/api/municipalities").then((r) => r.json()).then((d) => setMunicipalities(Array.isArray(d) ? d : [])).catch(() => {})
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setCatsLoading(false))
  }, [])

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Punto ÚNICO de sincronía: recibe un lugar resuelto (de la dirección, del pin o
  // del CP) y llena dirección, lat/lng, código postal, y hace coincidir Municipio y
  // Colonia con las opciones de la BD (por nombre, sin acentos). Así el pin, la
  // dirección, el CP y la colonia siempre concuerdan.
  const applyResolvedPlace = (p: ResolvedPlace) => {
    setForm((f) => ({
      ...f,
      addressText: p.address || f.addressText,
      latitude: p.lat.toFixed(6),
      longitude: p.lng.toFixed(6),
      postalCode: p.postalCode || f.postalCode,
    }))
    if (p.municipality) {
      const m = municipalities.find((mm) => normalizeName(mm.name) === normalizeName(p.municipality!))
      if (m) {
        setSelectedMunicipio(m.id)
        if (p.neighborhood) {
          const n = m.neighborhoods.find((nn) => normalizeName(nn.name) === normalizeName(p.neighborhood!))
          setForm((f) => ({ ...f, neighborhoodId: n ? n.id : f.neighborhoodId }))
        }
      }
    }
  }

  // Geocodifica el código postal → mueve el mapa y sincroniza todo.
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
          applyResolvedPlace({
            address: form.addressText || res[0].formatted_address || "",
            lat: loc.lat(),
            lng: loc.lng(),
            ...parseAddressComponents(res[0].address_components),
            postalCode: cp,
          })
        }
      },
    )
  }

  // Geocodifica una colonia elegida (dentro del municipio) → mueve el pin y CP.
  const geocodeNeighborhood = (neighborhoodId: string) => {
    const g = (window as any).google
    if (!g?.maps?.Geocoder || !neighborhoodId) return
    const muni = municipalities.find((m) => m.id === selectedMunicipio)
    const colonia = muni?.neighborhoods.find((n) => n.id === neighborhoodId)?.name
    if (!colonia) return
    const query = `${colonia}, ${muni?.name ?? ""}, Jalisco, México`
    new g.maps.Geocoder().geocode(
      { address: query, componentRestrictions: { country: "MX" } },
      (res: any, status: string) => {
        if (status === "OK" && res?.[0]?.geometry?.location) {
          const loc = res[0].geometry.location
          const parsed = parseAddressComponents(res[0].address_components)
          setForm((f) => ({
            ...f,
            latitude: loc.lat().toFixed(6),
            longitude: loc.lng().toFixed(6),
            postalCode: parsed.postalCode || f.postalCode,
          }))
        }
      },
    )
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
  const municipio = municipalities.find((m) => m.id === selectedMunicipio)

  // ── Índice de giros para buscar/detectar (solo del perfil elegido) ───────────
  const giroIndex = useMemo<GiroIndexEntry[]>(() => {
    const out: GiroIndexEntry[] = []
    for (const cat of categories) {
      for (const sub of cat.subcategories ?? []) {
        const p = perfilOf(sub.meta)
        if (p && p !== profileType) continue // giro de otro perfil: se omite
        const kw = sub.meta?.keywords || ""
        const sin = sub.meta?.sinonimos || ""
        out.push({
          catId: cat.id,
          catName: cat.name,
          catIcon: cat.icon,
          sub,
          name: normalizeSearch(sub.name),
          haystack: normalizeSearch([sub.name, cat.name, kw, sin].join(" ")),
          kwTokens: new Set([...tokenize(sub.name), ...tokenize(kw), ...tokenize(sin)]),
        })
      }
    }
    return out
  }, [categories, profileType])

  const isSearching = giroQuery.trim().length >= 2

  // Resultados del buscador: todos los tokens deben aparecer (AND), ordenados por
  // relevancia (coincidencia en el nombre pesa más que en keywords/categoría).
  const searchResults = useMemo<GiroIndexEntry[]>(() => {
    const q = normalizeSearch(giroQuery)
    if (q.length < 2) return []
    const qTokens = q.split(" ").filter(Boolean)
    const scored: { e: GiroIndexEntry; score: number }[] = []
    for (const e of giroIndex) {
      if (!qTokens.every((t) => e.haystack.includes(t))) continue
      let score = 0
      if (e.name.startsWith(q)) score += 100
      else if (e.name.includes(q)) score += 60
      if (e.haystack.includes(q)) score += 20
      for (const t of qTokens) if (e.name.includes(t)) score += 10
      scored.push({ e, score })
    }
    scored.sort((a, b) => b.score - a.score || a.e.sub.name.length - b.e.sub.name.length)
    return scored.slice(0, 30).map((x) => x.e)
  }, [giroQuery, giroIndex])

  // Detección automática: sugiere giros según el nombre + descripción escritos,
  // por número de palabras clave del giro presentes en el texto.
  const detectedGiros = useMemo<GiroIndexEntry[]>(() => {
    const textTokens = new Set(tokenize(`${form.name} ${form.shortDescription}`))
    if (textTokens.size === 0) return []
    const scored: { e: GiroIndexEntry; score: number }[] = []
    for (const e of giroIndex) {
      let score = 0
      for (const t of textTokens) if (e.kwTokens.has(t)) score += 1
      if (score > 0) scored.push({ e, score })
    }
    scored.sort((a, b) => b.score - a.score)
    // Si hay coincidencias fuertes (>=2 palabras), se descartan las de una sola
    // (suelen ser ruido por un término común como "domicilio"). Si ninguna llega
    // a 2, se muestran las mejores de una coincidencia.
    const strong = scored.filter((x) => x.score >= 2)
    const pool = strong.length > 0 ? strong : scored
    return pool.slice(0, 4).map((x) => x.e)
  }, [form.name, form.shortDescription, giroIndex])

  // Selecciona un giro desde el buscador, las sugerencias o el acordeón.
  const selectGiro = (catId: string, sub: { id: string; meta?: GiroMeta | null }) => {
    setSelectedCategory(catId)
    setSelectedSubcategory(sub.id)
    if (sub.meta?.modelo) setOperationModel(sub.meta.modelo)
    setGiroQuery("")
    setOpenCat(catId)
  }

  // ── Clasificación por modelo de operación (Persona/Empresa) ──────────────────
  const Q1_OPTIONS = [
    { value: "local", label: "Tengo un establecimiento fijo", model: "Local comercial", loc: true, icon: Store },
    { value: "puesto", label: "Tengo un puesto fijo o semifijo", model: "Puesto fijo / semifijo", loc: true, icon: Tent },
    { value: "casa", label: "Trabajo desde casa / por pedido", model: "Desde casa / sobre pedido", loc: false, icon: Home },
    { value: "domicilio", label: "Trabajo a domicilio", model: "A domicilio", loc: false, icon: Bike },
    { value: "online", label: "Solo vendo por internet o redes", model: "En línea / redes", loc: false, icon: Globe },
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
    const QLabel = ({ n, children }: { n: number; children: string }) => (
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#006c49] text-xs font-bold text-white">
          {n}
        </span>
        <span className="text-sm font-semibold text-gray-900">{children}</span>
      </div>
    )
    const YesNo = ({ value, onSet }: { value: boolean | null; onSet: (v: boolean) => void }) => (
      <div className="grid max-w-xs grid-cols-2 gap-2.5">
        {[true, false].map((v) => {
          const active = value === v
          return (
            <button
              key={String(v)}
              type="button"
              onClick={() => onSet(v)}
              className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? "border-[#006c49] bg-[#f0faf6] text-[#006c49]"
                  : "border-gray-200 text-gray-600 hover:border-[#006c49]/50 hover:bg-gray-50"
              }`}
            >
              {v ? "Sí" : "No"}
            </button>
          )
        })}
      </div>
    )
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e6f4ee] text-[#006c49]">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cuéntanos cómo operas</h2>
            <p className="mt-1 text-sm text-gray-500">
              Con 3 preguntas rápidas te ubicamos como <strong>Emprendedor</strong> o{" "}
              <strong>Negocio</strong>. Podrás cambiarlo cuando quieras.
            </p>
          </div>
        </div>

        <div className="space-y-7">
          <div>
            <QLabel n={1}>¿Cómo ofreces tus productos o servicios?</QLabel>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {Q1_OPTIONS.map((o) => {
                const active = q1 === o.value
                const Icon = o.icon
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setQ1(o.value)}
                    className={`group flex items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition-all ${
                      active
                        ? "border-[#006c49] bg-[#f0faf6]"
                        : "border-gray-200 hover:border-[#006c49]/50 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        active
                          ? "bg-[#006c49] text-white"
                          : "bg-gray-100 text-gray-500 group-hover:bg-[#e6f4ee] group-hover:text-[#006c49]"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className={`flex-1 text-sm ${active ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                      {o.label}
                    </span>
                    {active && <Check className="h-4 w-4 shrink-0 text-[#006c49]" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <QLabel n={2}>¿Atiendes al público en un lugar específico?</QLabel>
            <YesNo value={q2} onSet={setQ2} />
          </div>

          <div>
            <QLabel n={3}>¿Tienes horarios de atención?</QLabel>
            <YesNo value={q3} onSet={setQ3} />
          </div>

          {answered && (
            <div className="rounded-2xl border border-[#006c49]/25 bg-gradient-to-br from-[#f0faf6] to-white p-5">
              <div className="flex items-center gap-1.5 text-[#006c49]">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wide">Recomendación</span>
              </div>
              <p className="mt-2 text-[15px] text-gray-800">
                Te sugerimos registrarte como{" "}
                <strong className="text-[#006c49]">
                  {suggestedType === "EMPRENDEDOR" ? "Emprendedor" : "Negocio"}
                </strong>
                {suggestedModel ? (
                  <>
                    {" "}· modelo <strong>{suggestedModel}</strong>
                  </>
                ) : null}
                .
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
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
            <Label>Categoría y giro (¿a qué te dedicas?)</Label>
            {selectedSubcategory && (() => {
              const sel = currentCategory?.subcategories.find((s) => s.id === selectedSubcategory)
              return sel ? (
                <p className="mb-2 mt-1 text-sm text-[#006c49]">
                  Elegido: <strong>{currentCategory?.name}</strong> · {sel.name}
                </p>
              ) : null
            })()}
            {/* Buscador de giro: filtra al escribir por nombre, categoría, keywords y sinónimos. */}
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={giroQuery}
                onChange={(e) => setGiroQuery(e.target.value)}
                placeholder="Busca tu giro (ej: tacos, estética, plomería…)"
                className="pl-9"
                aria-label="Buscar giro"
              />
            </div>

            {isSearching ? (
              /* Resultados del buscador: lista plana ordenada por relevancia. */
              <div className="mt-2 max-h-80 divide-y overflow-y-auto rounded-lg border">
                {searchResults.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">
                    No encontramos giros con “{giroQuery}”. Prueba otra palabra, o usa “Solicítalo” abajo.
                  </p>
                ) : (
                  searchResults.map((e) => (
                    <button
                      key={e.sub.id}
                      type="button"
                      onClick={() => selectGiro(e.catId, e.sub)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                        selectedSubcategory === e.sub.id ? "bg-[#006c49]/10 font-medium text-[#006c49]" : "text-gray-700"
                      }`}
                    >
                      <span>{e.sub.name}</span>
                      <span className="ml-2 shrink-0 text-xs text-gray-400">
                        {e.catIcon ? `${e.catIcon} ` : ""}
                        {e.catName}
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Detección automática: sugerencias según el nombre/descripción escritos. */}
                {!selectedSubcategory && detectedGiros.length > 0 && (
                  <div className="mt-2 rounded-lg border border-[#006c49]/20 bg-[#006c49]/5 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#006c49]">
                      <Sparkles className="h-3.5 w-3.5" />
                      ¿Es alguno de estos? Según lo que escribiste
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {detectedGiros.map((e) => (
                        <button
                          key={e.sub.id}
                          type="button"
                          onClick={() => selectGiro(e.catId, e.sub)}
                          className="rounded-full border border-[#006c49]/30 bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-[#006c49] hover:text-white"
                        >
                          {e.sub.name}
                          <span className="ml-1 opacity-60">· {e.catName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acordeón: categorías colapsadas; se expanden para ver y elegir el giro. */}
                <div className="mt-2 max-h-80 divide-y overflow-y-auto rounded-lg border">
                  {catsLoading ? (
                    <div className="space-y-2 p-3">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-9 animate-pulse rounded-md bg-gray-100" />
                      ))}
                    </div>
                  ) : categories.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">
                      No pudimos cargar las categorías. Recarga la página, o usa la opción “Solicítalo” de aquí abajo.
                    </p>
                  ) : (
                    categories.map((cat) => {
                      // Solo los giros del perfil elegido (Emprendedor/Negocio). Los giros
                      // sin perfil marcado se muestran en ambos.
                      const giros = (cat.subcategories ?? []).filter((s) => {
                        const p = perfilOf(s.meta)
                        return !p || p === profileType
                      })
                      if (giros.length === 0) return null
                      const open = openCat === cat.id
                      return (
                        <div key={cat.id}>
                          <button
                            type="button"
                            onClick={() => setOpenCat(open ? "" : cat.id)}
                            className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                              selectedCategory === cat.id ? "font-semibold text-[#006c49]" : "text-gray-700"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {cat.icon && <span>{cat.icon}</span>}
                              {cat.name}
                              <span className="text-xs font-normal text-gray-400">({giros.length})</span>
                            </span>
                            <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                          </button>
                          {open && (
                            <div className="grid gap-1 bg-gray-50/50 p-2 sm:grid-cols-2">
                              {giros.map((sub) => (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => selectGiro(cat.id, sub)}
                                  className={`rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                                    selectedSubcategory === sub.id ? "bg-[#006c49] text-white" : "text-gray-700 hover:bg-white"
                                  }`}
                                >
                                  {sub.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}
            <SuggestGiro />

            {/* Modelo de operación + aviso de perfil sugerido (del catálogo). */}
            {selectedSubcategory && (() => {
              const sub = currentCategory?.subcategories.find((s) => s.id === selectedSubcategory)
              const suggested = perfilOf(sub?.meta) // "EMPRENDEDOR" | "NEGOCIO" | ""
              const label = suggested === "EMPRENDEDOR" ? "Emprendedor" : "Negocio"
              return (
                <div className="mt-3 space-y-2">
                  {suggested && suggested !== profileType && (
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
                <Select value={form.neighborhoodId} onValueChange={(v) => { if (v) { updateField("neighborhoodId", v); geocodeNeighborhood(v) } }} items={Object.fromEntries((municipio?.neighborhoods ?? []).map((n) => [n.id, n.name]))}>
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
              onPlace={applyResolvedPlace}
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
              onResolved={applyResolvedPlace}
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
