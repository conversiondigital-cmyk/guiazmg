"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "@/lib/icons"

export default function NewPromocionPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    code: "",
    startDate: "",
    endDate: "",
  })

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
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Promoción</h1>
        <p className="text-gray-500">Crea un cupón o promoción para tu negocio</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" />
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
              <Button type="submit" disabled={saving || !form.title || !form.code}>
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
