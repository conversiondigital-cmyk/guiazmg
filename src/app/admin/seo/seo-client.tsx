"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search, Plus, Edit3, Trash2, Eye, EyeOff, Globe,
} from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { confirmDialog } from "@/components/ui/system-dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type LandingPage = {
  id: string
  slug: string
  title: string
  metaDescription: string | null
  content: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type SystemSetting = {
  id: string
  key: string
  value: string
  description: string | null
  updatedAt: string
}

interface SeoClientProps {
  landingPages: LandingPage[]
  defaultMeta: SystemSetting[]
  seoSettings: SystemSetting[]
}

type FormData = {
  slug: string
  title: string
  metaDescription: string
  content: string
}

const emptyForm: FormData = { slug: "", title: "", metaDescription: "", content: "" }

const metaKeyLabels: Record<string, string> = {
  seo_default_title: "Título por defecto",
  seo_default_description: "Descripción por defecto",
  seo_default_keywords: "Keywords por defecto",
}

export function SeoClient({ landingPages, defaultMeta, seoSettings }: SeoClientProps) {
  const router = useRouter()
  const [pages] = useState(landingPages)
  const [editing, setEditing] = useState<LandingPage | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const defaultMetaMap: Record<string, string> = {}
  for (const s of defaultMeta) defaultMetaMap[s.key] = s.value

  const seoMap: Record<string, string> = {}
  for (const s of seoSettings) seoMap[s.key] = s.value

  const openCreate = () => {
    setForm(emptyForm)
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (page: LandingPage) => {
    setForm({
      slug: page.slug,
      title: page.title,
      metaDescription: page.metaDescription ?? "",
      content: page.content ?? "",
    })
    setEditing(page)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        await fetch("/api/admin/seo", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form }),
        })
      } else {
        const res = await fetch("/api/admin/seo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error("Error")
      }
      setDialogOpen(false)
      router.refresh()
    } catch {
      console.error("Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      await fetch("/api/admin/seo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleActive", id }),
      })
      router.refresh()
    } catch {
      console.error("Toggle failed")
    }
  }

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog({
      title: "Eliminar landing page",
      description: "¿Estás seguro de eliminar esta landing page?",
      destructive: true,
    }))) return
    try {
      await fetch("/api/admin/seo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      })
      router.refresh()
    } catch {
      console.error("Delete failed")
    }
  }

  const handleGenerate = async () => {
    if (!(await confirmDialog({
      title: "Generar landing pages",
      description: "¿Generar landing pages para todas las combinaciones de municipio + categoría?",
      confirmText: "Generar",
    }))) return
    setGenerating(true)
    try {
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Se crearon ${data.created} landing pages`)
        router.refresh()
      }
    } catch {
      console.error("Generate failed")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">SEO</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generando..." : "Generar automáticamente"}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Crear Landing
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Meta Description</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[180px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No hay landing pages
                </TableCell>
              </TableRow>
            ) : (
              pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-mono text-sm">{page.slug}</TableCell>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {page.metaDescription ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={page.isActive ? "default" : "secondary"}>
                      {page.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => openEdit(page)} title="Editar">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleToggleActive(page.id)} title={page.isActive ? "Desactivar" : "Activar"}>
                        {page.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(page.id)} title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              Meta por defecto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(metaKeyLabels).map(([key, label]) => (
              <div key={key}>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-sm">{defaultMetaMap[key] || "—"}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              Sitemap / Robots
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Sitemap URL</p>
              <p className="text-sm font-mono">{seoMap.sitemap_url || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">robots.txt</p>
              <pre className="mt-1 rounded bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
                {seoMap.robots_txt || "—"}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open ? true : false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Landing Page" : "Crear Landing Page"}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={form.metaDescription}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Contenido</Label>
              <Textarea
                id="content"
                rows={6}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.slug || !form.title}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
