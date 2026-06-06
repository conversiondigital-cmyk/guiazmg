"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Briefcase, DollarSign, UserCheck, ChevronDown, ChevronRight,
  Edit3, CheckCircle, XCircle, Plus, Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"

interface AgentUser {
  id: string; name: string | null; email: string; image: string | null; isActive: boolean
}

interface Agent {
  id: string; userId: string; commissionPercentage: number; isActive: boolean; createdAt: string
  user: AgentUser; businessesCount: number; commissionsCount: number
  pendingCommissions: number; totalCommissions: number
}

interface AgentsClientProps {
  agents: Agent[]
  stats: { activeAgents: number; totalClients: number; pendingCommissions: number }
}

export function AgentesClient({ agents, stats }: AgentsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [commissionValue, setCommissionValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", commission: "10" })
  const [creating, setCreating] = useState(false)
  const [agentDetails, setAgentDetails] = useState<Record<string, any>>({})

  const filtered = agents.filter(
    (a) =>
      a.user.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.user.email.toLowerCase().includes(search.toLowerCase())
  )

  async function toggleActive(agent: Agent) {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/sales-agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agent.id, isActive: !agent.isActive }),
      })
      if (res.ok) router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function saveCommission() {
    if (!editingAgent) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/sales-agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingAgent.id, commissionPercentage: Number(commissionValue) }),
      })
      if (res.ok) {
        setEditingAgent(null)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  async function createAgent() {
    setCreating(true)
    try {
      const res = await fetch("/api/admin/sales-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          commissionPercentage: Number(createForm.commission),
        }),
      })
      if (res.ok) {
        setShowCreateModal(false)
        setCreateForm({ name: "", email: "", password: "", commission: "10" })
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || "Error al crear agente")
      }
    } finally {
      setCreating(false)
    }
  }

  async function loadAgentDetails(agent: Agent) {
    if (agentDetails[agent.id]) return

    const res = await fetch(`/api/admin/sales-agents?details=${agent.id}`)
    if (res.ok) {
      const data = await res.json()
      setAgentDetails((prev) => ({ ...prev, [agent.id]: data }))
    }
  }

  async function toggleExpand(agentId: string) {
    if (expandedId === agentId) {
      setExpandedId(null)
    } else {
      setExpandedId(agentId)
      const agent = agents.find((a) => a.id === agentId)
      if (agent) loadAgentDetails(agent)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Agentes de Ventas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {agents.length} agente{agents.length !== 1 ? "s" : ""} registrado{agents.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger render={<Button><Plus className="size-4" />Nuevo Agente</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Agente de Ventas</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre</label>
                <Input
                  placeholder="Nombre completo"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Contraseña</label>
                <Input
                  type="password"
                  placeholder="Contraseña (mín. 6 caracteres)"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Comisión %</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={createForm.commission}
                  onChange={(e) => setCreateForm((f) => ({ ...f, commission: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancelar</Button>} />
              <Button onClick={createAgent} disabled={creating}>
                {creating ? "Creando..." : "Crear Agente"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserCheck className="size-4 text-emerald-500" />
            Agentes activos
          </div>
          <p className="mt-1 text-2xl font-bold">{stats.activeAgents}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="size-4 text-blue-500" />
            Total clientes captados
          </div>
          <p className="mt-1 text-2xl font-bold">{stats.totalClients}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="size-4 text-amber-500" />
            Comisiones pendientes
          </div>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(stats.pendingCommissions)}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Search className="size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar agente por nombre o email..."
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Agente</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Email</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Comisión %</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Clientes</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Ingresos</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Estado</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Registro</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((agent) => (
              // @ts-ignore Fragment with key
              <React.Fragment key={agent.id}>
                <tr
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleExpand(agent.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {expandedId === agent.id ? (
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="font-medium">{agent.user.name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{agent.user.email}</td>
                  <td className="px-4 py-3">{agent.commissionPercentage}%</td>
                  <td className="px-4 py-3">{agent.businessesCount}</td>
                  <td className="px-4 py-3">{formatCurrency(agent.totalCommissions)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={agent.isActive ? "default" : "secondary"}>
                      {agent.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(agent.createdAt).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingAgent(agent)
                          setCommissionValue(String(agent.commissionPercentage))
                        }}
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleActive(agent)
                        }}
                        disabled={saving}
                      >
                        {agent.isActive ? (
                          <XCircle className="size-3.5 text-destructive" />
                        ) : (
                          <CheckCircle className="size-3.5 text-emerald-500" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
                {expandedId === agent.id && (
                  <tr>
                    <td colSpan={8} className="bg-muted/30 p-4">
                      <AgentBusinessList />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No se encontraron agentes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editingAgent} onOpenChange={(o) => !o && setEditingAgent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Comisión</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {editingAgent?.user.name || editingAgent?.user.email}
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Porcentaje de comisión
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <Button onClick={saveCommission} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AgentBusinessList() {
  return (
    <div className="text-sm text-muted-foreground">
      <p className="mb-2 font-medium text-foreground">Negocios y comisiones</p>
      <p className="italic">Expanda un agente para ver sus negocios asignados y comisiones.</p>
    </div>
  )
}
