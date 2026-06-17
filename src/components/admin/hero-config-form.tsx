"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X, Loader2, Save } from "lucide-react"
import type { HeroConfig } from "@/lib/hero-config"

export function HeroConfigForm({ initialConfig }: { initialConfig: HeroConfig }) {
  const router = useRouter()
  const [titlePrefix, setTitlePrefix] = useState(initialConfig.titlePrefix)
  const [titleHighlight, setTitleHighlight] = useState(initialConfig.titleHighlight)
  const [subtitle, setSubtitle] = useState(initialConfig.subtitle)
  const [popular, setPopular] = useState<string[]>(initialConfig.popular)
  const [seconds, setSeconds] = useState(Math.round(initialConfig.intervalMs / 1000))
  const [chip, setChip] = useState("")
  const [saving, setSaving] = useState(false)

  function addChip() {
    const v = chip.trim()
    if (!v) return
    if (popular.some((p) => p.toLowerCase() === v.toLowerCase())) {
      setChip("")
      return
    }
    setPopular([...popular, v].slice(0, 12))
    setChip("")
  }

  async function save() {
    setSaving(true)
    try {
      const config = {
        titlePrefix: titlePrefix.trim(),
        titleHighlight: titleHighlight.trim(),
        subtitle: subtitle.trim(),
        popular,
        intervalMs: Math.min(30000, Math.max(2000, Math.round(seconds) * 1000)),
      }
      const res = await fetch("/api/admin/hero", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "No se pudo guardar")
        return
      }
      toast.success("Contenido del hero guardado")
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="hero-title-prefix">Título (primera parte)</Label>
          <Input
            id="hero-title-prefix"
            value={titlePrefix}
            onChange={(e) => setTitlePrefix(e.target.value)}
            placeholder="Encuentra lo mejor de"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hero-title-highlight">Palabra resaltada (en verde)</Label>
          <Input
            id="hero-title-highlight"
            value={titleHighlight}
            onChange={(e) => setTitleHighlight(e.target.value)}
            placeholder="Guadalajara"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hero-subtitle">Subtítulo</Label>
        <Textarea
          id="hero-subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          rows={3}
          placeholder="Descubre negocios locales, servicios profesionales…"
        />
      </div>

      <div className="space-y-2">
        <Label>Búsquedas populares (chips)</Label>
        <div className="flex flex-wrap gap-2">
          {popular.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 py-1 pl-3 pr-1 text-sm"
            >
              {p}
              <button
                type="button"
                onClick={() => setPopular(popular.filter((x) => x !== p))}
                className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                aria-label={`Quitar ${p}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {popular.length === 0 && <span className="text-sm text-muted-foreground">Sin chips.</span>}
        </div>
        <div className="flex gap-2">
          <Input
            value={chip}
            onChange={(e) => setChip(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addChip()
              }
            }}
            placeholder="Agregar búsqueda (Enter)"
            className="max-w-xs"
          />
          <Button type="button" variant="outline" onClick={addChip} disabled={popular.length >= 12}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hero-interval">Cambio de imagen del carrusel (segundos)</Label>
        <Input
          id="hero-interval"
          type="number"
          min={2}
          max={30}
          value={seconds}
          onChange={(e) => setSeconds(Number(e.target.value))}
          className="max-w-[140px]"
        />
        <p className="text-xs text-muted-foreground">Entre 2 y 30 segundos. Solo aplica si hay 2 o más imágenes.</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar contenido
        </Button>
      </div>
    </div>
  )
}
