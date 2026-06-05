"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Check, X, ExternalLink } from "@/lib/icons"

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
}

export function ClaimReviewList({ claims }: { claims: any[] }) {
  const [list, setList] = useState(claims)

  const handleAction = async (id: string, status: string, businessId?: string) => {
    try {
      const res = await fetch(`/api/claim-business/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, businessId }),
      })
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return }
      setList((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
      toast.success(status === "APPROVED" ? "Reclamación aprobada" : "Reclamación rechazada")
    } catch { toast.error("Error") }
  }

  if (list.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-gray-500">
          No hay solicitudes de reclamación pendientes.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {list.map((claim) => (
        <Card key={claim.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{claim.business?.name || claim.businessName}</span>
                  <Badge className={statusColors[claim.status] || ""}>{claim.status}</Badge>
                </div>
                <p className="text-sm text-gray-500">
                  Solicitado por: {claim.user.name || claim.user.email}
                </p>
                <p className="text-xs text-gray-400">{new Date(claim.createdAt).toLocaleDateString()}</p>
                {claim.message && <p className="text-sm text-gray-600 mt-1">{claim.message}</p>}
              </div>
              {claim.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleAction(claim.id, "APPROVED", claim.businessId)}>
                    <Check className="h-4 w-4 mr-1" /> Aprobar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleAction(claim.id, "REJECTED")}>
                    <X className="h-4 w-4 mr-1" /> Rechazar
                  </Button>
                </div>
              )}
              {claim.business && (
                <a href={`/perfil/${claim.business.slug}`} target="_blank" className="text-blue-600 text-xs flex items-center gap-1">
                  Ver perfil <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
