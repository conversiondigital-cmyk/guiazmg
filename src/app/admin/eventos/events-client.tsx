"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { confirmDialog } from "@/components/ui/system-dialog"
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Upload, CalendarDays } from "lucide-react"

interface EventRow {
  id: string
  title: string
  slug: string
  description: string | null
  startAt: string
  endAt: string | null
  venueName: string | null
  addressText: string | null
  municipalityId: string | null
  latitude: number | null
  longitude: number | null
  category: string | null
  isFree: boolean
  priceText: string | null
  ticketUrl: string | null
  organizer: string | null
  coverImageUrl: string | null
  isPublished: boolean
  isFeatured: boolean
}

type Muni = { id: string; name: string }

const empty = {
  title: "", category: "", startAt: "", endAt: "", venueName: "", municipalityId: "",
  addressText: "", latitude: "", longitude: "", description: "", isFree: true, priceText: "",
  ticketUrl: "", organizer: "", coverImageUrl: "", isPublished: true, isFeatured: false,
}
type FormState = typeof empty

function toLocalInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EventsClient({ initialEvents, municipalities }: { initialEvents: EventRow[]; municipalities: Muni[] }) {
  const router = useRouter()
  const [events, setEvents] = useState<EventRow[]>(initialEvents)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const muniName = (id: string | null) => municipalities.find((m) => m.id === id)?.name ?? "—"

  function openNew() {
    setEditingId(null)
    setForm(empty)
    setOpen(true)
  }
  function openEdit(ev: EventRow) {
    setEditingId(ev.id)
    setForm({
      title: ev.title, category: ev.category ?? "", startAt: toLocalInput(ev.startAt), endAt: toLocalInput(ev.endAt),
      venueName: ev.venueName ?? "", municipalityId: ev.municipalityId ?? "", addressText: ev.addressText ?? "",
      latitude: ev.latitude?.toString() ?? "", longitude: ev.longitude?.toString() ?? "", description: ev.description ?? "",
      isFree: ev.isFree, priceText: ev.priceText ?? "", ticketUrl: ev.ticketUrl ?? "", organizer: ev.organizer ?? "",
      coverImageUrl: ev.coverImageUrl ?? "", isPublished: ev.isPublished, isFeatured: ev.isFeatured,
    })
    setOpen(true)
  }

  const set = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  async function onCover(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "events")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo subir la imagen")
        return
      }
      const url = data.provider === "local" && data.key ? `/uploads/${data.key}` : data.url
      set("coverImageUrl", url)
      toast.success("Imagen subida")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function save() {
    if (!form.title.trim()) return toast.error("El título es obligatorio")
    if (!form.startAt) return toast.error("La fecha de inicio es obligatoria")
    setSaving(true)
    try {
      const payload = { ...form, latitude: form.latitude || null, longitude: form.longitude || null }
      const res = await fetch(editingId ? `/api/admin/events/${editingId}` : "/api/admin/events", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo guardar")
        return
      }
      toast.success(editingId ? "Evento actualizado" : "Evento creado")
      setOpen(false)
      router.refresh()
      // Refresca la lista localmente.
      const ev: EventRow = data.event
      setEvents((prev) => (editingId ? prev.map((e) => (e.id === ev.id ? ev : e)) : [ev, ...prev]))
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish(ev: EventRow) {
    const res = await fetch(`/api/admin/events/${ev.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !ev.isPublished }),
    })
    if (!res.ok) return toast.error("No se pudo cambiar")
    setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, isPublished: !e.isPublished } : e)))
    router.refresh()
  }

  async function remove(ev: EventRow) {
    if (!(await confirmDialog({ title: "Eliminar evento", description: `¿Eliminar "${ev.title}"?`, destructive: true }))) return
    const res = await fetch(`/api/admin/events/${ev.id}`, { method: "DELETE" })
    if (!res.ok) return toast.error("No se pudo eliminar")
    setEvents((prev) => prev.filter((e) => e.id !== ev.id))
    toast.success("Evento eliminado")
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {!open && (
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Nuevo evento
        </Button>
      )}

      {open && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="text-lg font-semibold">{editingId ? "Editar evento" : "Nuevo evento"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Título *</Label>
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Festival Cultural de Mayo" />
              </div>
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Cultura, Música, Taller…" />
              </div>
              <div className="space-y-1.5">
                <Label>Organizador</Label>
                <Input value={form.organizer} onChange={(e) => set("organizer", e.target.value)} placeholder="Secretaría de Cultura" />
              </div>
              <div className="space-y-1.5">
                <Label>Inicio *</Label>
                <Input type="datetime-local" value={form.startAt} onChange={(e) => set("startAt", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Fin (opcional)</Label>
                <Input type="datetime-local" value={form.endAt} onChange={(e) => set("endAt", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Lugar / recinto</Label>
                <Input value={form.venueName} onChange={(e) => set("venueName", e.target.value)} placeholder="Teatro Degollado" />
              </div>
              <div className="space-y-1.5">
                <Label>Municipio</Label>
                <select
                  value={form.municipalityId}
                  onChange={(e) => set("municipalityId", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  {municipalities.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Dirección</Label>
                <Input value={form.addressText} onChange={(e) => set("addressText", e.target.value)} placeholder="Av. Juárez s/n, Centro" />
              </div>
              <div className="space-y-1.5">
                <Label>Latitud</Label>
                <Input value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="20.6767" />
              </div>
              <div className="space-y-1.5">
                <Label>Longitud</Label>
                <Input value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="-103.3475" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Descripción</Label>
                <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Enlace (boletos / info)</Label>
                <Input value={form.ticketUrl} onChange={(e) => set("ticketUrl", e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-1.5">
                <Label>Imagen de portada</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Subir
                  </Button>
                  {form.coverImageUrl && <span className="truncate text-xs text-muted-foreground">{form.coverImageUrl}</span>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onCover(e.target.files?.[0] ?? null)} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isFree} onChange={(e) => set("isFree", e.target.checked)} /> Gratuito
              </label>
              {!form.isFree && (
                <Input value={form.priceText} onChange={(e) => set("priceText", e.target.value)} placeholder="$150" className="max-w-[120px]" />
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} /> Publicado
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} /> Destacado
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-muted-foreground">
            Aún no hay eventos. Crea el primero con “Nuevo evento”.
          </div>
        ) : (
          events.map((ev) => (
            <Card key={ev.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-gray-900">{ev.title}</span>
                    {!ev.isPublished && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">Borrador</span>}
                    {ev.isFeatured && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-700">Destacado</span>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(ev.startAt))}
                    </span>
                    <span>{muniName(ev.municipalityId)}</span>
                    <span>{ev.isFree ? "Gratis" : ev.priceText || "De pago"}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => togglePublish(ev)} title={ev.isPublished ? "Despublicar" : "Publicar"}>
                    {ev.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(ev)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => remove(ev)} title="Eliminar">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
