"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Store,
  MapPin,
  ShoppingBag,
  Zap,
  Calendar,
  CheckCircle,
  ArrowRight,
  Loader2,
  CreditCard,
} from "@/lib/icons"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type Business = { id: string; name: string }
type Listing = { id: string; title: string; status: string }
type BoostDef = { id: string; name: string; durationDays: number; price: number; priorityBonus: number }

interface Props {
  businesses: Business[]
  listings: Listing[]
  boostDefinitions: BoostDef[]
}

const targetTypes = [
  { value: "business", label: "Perfil general", icon: Store, desc: "Impulsa todo tu perfil" },
  { value: "listing", label: "Anuncio específico", icon: MapPin, desc: "Selecciona un anuncio para potenciar" },
  { value: "marketplace", label: "Marketplace", icon: ShoppingBag, desc: "Destaca en el marketplace" },
] as const

type TargetType = (typeof targetTypes)[number]["value"]

export default function BoostWizard({ businesses, listings, boostDefinitions }: Props) {
  const [step, setStep] = useState(1)
  const [targetType, setTargetType] = useState<TargetType | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedListingId, setSelectedListingId] = useState<string>("")
  const [selectedDefId, setSelectedDefId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const activeListings = listings.filter((l) => l.status === "ACTIVE")
  const selectedDef = boostDefinitions.find((d) => d.id === selectedDefId)

  const canProceed = () => {
    if (step === 1) return targetType !== null
    if (step === 2) {
      if (targetType === "listing") return selectedBusinessId !== "" && selectedListingId !== ""
      return selectedBusinessId !== ""
    }
    if (step === 3) return selectedDefId !== ""
    return true
  }

  const handleConfirm = async () => {
    if (!selectedDef || !selectedBusinessId) return
    setLoading(true)

    try {
      const res = await fetch("/api/payments/create-boost-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBusinessId,
          listingId: targetType === "listing" ? selectedListingId : null,
          boostDefinitionId: selectedDef.id,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Error al activar el boost")
        return
      }

      const data = await res.json()
      if (!data.initPoint) {
        toast.error("No se pudo iniciar el pago del boost")
        return
      }

      window.location.href = data.initPoint
    } catch {
      toast.error("Error al activar el boost")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                s === step
                  ? "bg-blue-600 text-white"
                  : s < step
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {s < step ? <CheckCircle className="h-4 w-4" /> : s}
            </div>
            <span className={`hidden sm:inline ${s === step ? "text-blue-600 font-medium" : "text-gray-400"}`}>
              {s === 1 && "Tipo"}
              {s === 2 && "Objetivo"}
              {s === 3 && "Duración"}
              {s === 4 && "Confirmar"}
            </span>
            {s < 4 && <div className="w-6 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Target Type */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Selecciona el tipo de boost</CardTitle>
            <CardDescription>Elige qué quieres impulsar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {targetTypes.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.value}
                    onClick={() => setTargetType(t.value)}
                    className={`text-left p-5 rounded-xl border-2 transition-all ${
                      targetType === t.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <Icon className="h-8 w-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-gray-900">{t.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Target */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {targetType === "listing"
                ? "Selecciona negocio y anuncio"
                : "Selecciona el negocio"}
            </CardTitle>
            <CardDescription>
              {targetType === "listing"
                ? "Elige el negocio y el anuncio que deseas impulsar"
                : "Elige el negocio que deseas impulsar"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Negocio
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {businesses.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBusinessId(b.id)
                      setSelectedListingId("")
                    }}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${
                      selectedBusinessId === b.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <Store className="h-5 w-5 text-blue-600 mb-1" />
                    <p className="font-medium text-gray-900">{b.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {targetType === "listing" && selectedBusinessId && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Anuncio específico
                </label>
                {activeListings.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    No tienes anuncios activos en este negocio.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeListings.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setSelectedListingId(l.id)}
                        className={`text-left p-4 rounded-lg border-2 transition-all ${
                          selectedListingId === l.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <MapPin className="h-5 w-5 text-blue-600 mb-1" />
                        <p className="font-medium text-gray-900">{l.title}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Duration */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Selecciona la duración</CardTitle>
            <CardDescription>
              Elige por cuántos días quieres activar el boost
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {boostDefinitions.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDefId(d.id)}
                  className={`text-left p-5 rounded-xl border-2 transition-all ${
                    selectedDefId === d.id
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">{d.name}</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{d.durationDays}</p>
                  <p className="text-sm text-gray-500 mb-3">días</p>
                  <div className="flex items-center gap-2 text-sm">
                     <CreditCard className="h-4 w-4 text-amber-500" />
                     <span className="font-medium text-amber-600">{d.price.toLocaleString()} MXN</span>
                  </div>
                  {d.priorityBonus > 0 && (
                    <Badge className="mt-2 bg-blue-100 text-blue-700 border-blue-200">
                      +{d.priorityBonus} prioridad
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && selectedDef && (
        <Card>
          <CardHeader>
            <CardTitle>Confirma tu boost</CardTitle>
            <CardDescription>Revisa los detalles antes de activar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Tipo</span>
                <span className="font-medium text-gray-900">
                  {targetTypes.find((t) => t.value === targetType)?.label}
                </span>
              </div>
              {selectedBusinessId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Negocio</span>
                  <span className="font-medium text-gray-900">
                    {businesses.find((b) => b.id === selectedBusinessId)?.name}
                  </span>
                </div>
              )}
              {targetType === "listing" && selectedListingId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Anuncio</span>
                  <span className="font-medium text-gray-900">
                    {activeListings.find((l) => l.id === selectedListingId)?.title}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Duración</span>
                <span className="font-medium text-gray-900">
                  {selectedDef.durationDays} días
                </span>
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="font-medium text-gray-700">Costo</span>
                <span className="text-xl font-bold text-amber-600">
                  {selectedDef.price.toLocaleString()} MXN
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Activando...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Activar Boost
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          Anterior
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
