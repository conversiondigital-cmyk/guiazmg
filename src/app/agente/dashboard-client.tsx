"use client"

import { useEffect, useState } from "react"
import { Briefcase, TrendingUp, DollarSign, RefreshCw, Plus, Phone, Mail, Calendar, UserPlus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"

interface Prospect {
  id: string
  name: string
  businessName: string
  phone: string
  email: string
  notes?: string
  status: string
  createdAt: string
}

const STAGES = [
  { key: "NUEVO", label: "Nuevo", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  { key: "CONTACTADO", label: "Contactado", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  { key: "INTERESADO", label: "Interesado", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
  { key: "CLIENTE", label: "Cliente", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  { key: "RENOVADO", label: "Renovado", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { key: "PERDIDO", label: "Perdido", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
]

const NEXT_STAGE: Record<string, string> = {
  NUEVO: "CONTACTADO",
  CONTACTADO: "INTERESADO",
  INTERESADO: "CLIENTE",
  CLIENTE: "RENOVADO",
  RENOVADO: "RENOVADO",
  PERDIDO: "PERDIDO",
}

function ProspectCard({
  prospect,
  onMove,
  onDelete,
}: {
  prospect: Prospect
  onMove: (id: string, status: string) => void
  onDelete: (id: string) => void
}) {
  const canAdvance = NEXT_STAGE[prospect.status] && NEXT_STAGE[prospect.status] !== prospect.status
  const canRegress = prospect.status !== "NUEVO" && prospect.status !== "PERDIDO"

  return (
    <div className="rounded-lg border bg-card p-3 text-sm shadow-sm transition-all hover:shadow-md">
      <div className="mb-1 flex items-start justify-between">
        <p className="font-medium leading-tight">{prospect.name}</p>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-destructive -mr-1 -mt-1"
          onClick={() => onDelete(prospect.id)}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </Button>
      </div>
      {prospect.businessName && (
        <p className="text-xs text-muted-foreground truncate">{prospect.businessName}</p>
      )}
      <div className="mt-2 space-y-1">
        {prospect.phone && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="size-3 shrink-0" />
            {prospect.phone}
          </p>
        )}
        {prospect.email && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
            <Mail className="size-3 shrink-0" />
            {prospect.email}
          </p>
        )}
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="size-3 shrink-0" />
          {new Date(prospect.createdAt).toLocaleDateString("es-MX")}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-1">
        {canRegress && prospect.status !== "PERDIDO" && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              const stageIndex = STAGES.findIndex((s) => s.key === prospect.status)
              if (stageIndex > 0) onMove(prospect.id, STAGES[stageIndex - 1].key)
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Button>
        )}
        {canAdvance && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onMove(prospect.id, NEXT_STAGE[prospect.status])}
          >
            <ArrowRight className="size-3" />
          </Button>
        )}
        {prospect.status !== "PERDIDO" && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto text-muted-foreground hover:text-destructive"
            onClick={() => onMove(prospect.id, "PERDIDO")}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  )
}

export function AgentDashboardClient() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [stats, setStats] = useState({
    clientsCount: 0,
    businessesCount: 0,
    pendingCommissions: 0,
    renewals: 0,
  })
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "", businessName: "", phone: "", email: "", notes: "",
  })
  useEffect(() => {
    fetch("/api/agent/prospects")
      .then((r) => r.json())
      .then((data) => {
        if (data.prospects) setProspects(data.prospects)
      })
      .catch(() => {})

    fetch("/api/agent/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.clientsCount !== undefined) setStats(data)
      })
      .catch(() => {})

  }, [])

  async function addProspect() {
    if (!formData.name.trim()) return
    try {
      const res = await fetch("/api/agent/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          businessName: formData.businessName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          notes: formData.notes.trim(),
        }),
      })
      const data = await res.json()
      if (data.prospect) {
        setProspects((prev) => [data.prospect, ...prev])
      }
    } catch {}
    setFormData({ name: "", businessName: "", phone: "", email: "", notes: "" })
    setShowForm(false)
  }

  async function moveProspect(id: string, newStatus: string) {
    setProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    )
    try {
      await fetch("/api/agent/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })
    } catch {}
  }

  function deleteProspect(id: string) {
    setProspects((prev) => prev.filter((p) => p.id !== id))
  }

  const prospectsByStage = Object.fromEntries(
    STAGES.map((s) => [s.key, prospects.filter((p) => p.status === s.key)])
  )

  const kpis = [
    { label: "Clientes captados", value: stats.clientsCount, icon: Briefcase, color: "from-blue-500/20 to-blue-600/10 text-blue-600" },
    { label: "Negocios registrados", value: stats.businessesCount, icon: TrendingUp, color: "from-emerald-500/20 to-emerald-600/10 text-emerald-600" },
    { label: "Comisiones pendientes", value: formatCurrency(stats.pendingCommissions), icon: DollarSign, color: "from-amber-500/20 to-amber-600/10 text-amber-600" },
    { label: "Renovaciones", value: stats.renewals, icon: RefreshCw, color: "from-purple-500/20 to-purple-600/10 text-purple-600" },
  ]

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard de Ventas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {prospects.length} prospecto{prospects.length !== 1 ? "s" : ""} en total
          </p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger render={<Button><UserPlus className="size-4" />Registrar Prospecto</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Prospecto</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre *</label>
                <Input
                  placeholder="Nombre del contacto"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Negocio</label>
                <Input
                  placeholder="Nombre del negocio"
                  value={formData.businessName}
                  onChange={(e) => setFormData((f) => ({ ...f, businessName: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Teléfono</label>
                <Input
                  placeholder="Teléfono"
                  value={formData.phone}
                  onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Notas</label>
                <textarea
                  className="h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="Notas adicionales"
                  value={formData.notes}
                  onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancelar</Button>} />
              <Button onClick={addProspect}>Guardar Prospecto</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br p-4 ring-1 ring-foreground/5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br opacity-80 ${kpi.color}`} />
              <div className="relative z-10">
                <Icon className="mb-2 size-5 opacity-70" />
                <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {prospects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card p-12 text-center">
          <UserPlus className="mb-3 size-10 text-muted-foreground/50" />
          <h3 className="font-heading text-base font-medium">No hay prospectos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre su primer prospecto para comenzar el pipeline de ventas
          </p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="size-4" />Registrar Prospecto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((stage) => {
            const stageProspects = prospectsByStage[stage.key] || []
            return (
              <div key={stage.key} className="rounded-xl border bg-card">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${stage.color.split(" ")[0]}`} />
                    <span className="text-xs font-medium">{stage.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stageProspects.length}
                  </Badge>
                </div>
                <div className="space-y-2 p-2 min-h-[200px]">
                  {stageProspects.map((prospect) => (
                    <ProspectCard
                      key={prospect.id}
                      prospect={prospect}
                      onMove={moveProspect}
                      onDelete={deleteProspect}
                    />
                  ))}
                  {stageProspects.length === 0 && (
                    <p className="py-8 text-center text-xs text-muted-foreground">
                      Sin prospectos
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
