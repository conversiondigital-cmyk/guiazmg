export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Crown, Star, Zap, Check, ArrowRight, Calendar, Gem, CheckCircle, Link as LinkIcon, Globe, Store } from "@/lib/icons"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "ACTIVA", color: "bg-green-100 text-green-700 border-green-300" },
  PAST_DUE: { label: "VENCIDA", color: "bg-red-100 text-red-700 border-red-300" },
  EXPIRED: { label: "EXPIRADA", color: "bg-gray-100 text-gray-700 border-gray-300" },
  CANCELLED: { label: "CANCELADA", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  TRIAL: { label: "PRUEBA", color: "bg-green-100 text-green-800 border-green-300" },
}

const planIcon: Record<string, React.ReactNode> = {
  free: <Star className="h-5 w-5 text-gray-400" />,
  basic: <Zap className="h-5 w-5 text-green-600" />,
  professional: <Crown className="h-5 w-5 text-amber-500" />,
  premium: <Gem className="h-5 w-5 text-purple-500" />,
}

export default async function MembresiaPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const plans = await prisma.membershipPlan.findMany({
    where: { isActive: true },
    orderBy: { monthlyPrice: "asc" },
  })

  const businesses = await prisma.profile.findMany({
    where: { ownerId: session.user.id },
    include: {
      memberships: {
        include: { plan: true },
        orderBy: { currentPeriodEnd: "desc" },
      },
    },
  })

  const allMemberships = businesses.flatMap((b) => b.memberships)
  const activeMembership = allMemberships.find(
    (m) => m.status === "ACTIVE" || m.status === "TRIAL",
  )

  const periodRemaining = activeMembership
    ? Math.max(
        0,
        Math.min(
          100,
          100 -
            ((Date.now() - activeMembership.currentPeriodStart.getTime()) /
              (activeMembership.currentPeriodEnd.getTime() -
                activeMembership.currentPeriodStart.getTime())) *
              100,
        ),
      )
    : 0

  const statusInfo = activeMembership
    ? statusConfig[activeMembership.status] || {
        label: activeMembership.status,
        color: "bg-gray-100 text-gray-700",
      }
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Membresía</h1>
        <p className="text-gray-500">Administra tu plan y beneficios</p>
      </div>

      {activeMembership ? (
        <>
          <Card className="border-green-200 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Crown className="h-7 w-7 text-amber-500" />
                    <h2 className="text-xl font-bold text-gray-900">
                      {activeMembership.plan.name}
                    </h2>
                    {statusInfo && (
                      <Badge variant="outline" className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {formatCurrency(Number(activeMembership.plan.monthlyPrice))} MXN/mes
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Período actual</span>
                      <span className="text-gray-700 font-medium">
                        {Math.round(periodRemaining)}% restante
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-700 h-2 rounded-full transition-all"
                        style={{ width: `${periodRemaining}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Inicio:{" "}
                        {activeMembership.currentPeriodStart.toLocaleDateString("es-MX")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Renovación:{" "}
                        {activeMembership.currentPeriodEnd.toLocaleDateString("es-MX")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <Switch
                        defaultChecked={activeMembership.cancelAtPeriodEnd}
                        disabled
                      />
                      Cancelar al final del período
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/planes">Cambiar plan</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold text-green-700">
                  {activeMembership.plan.maxListings}
                </p>
                <p className="text-xs text-gray-500 mt-1">Anuncios máximos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold text-green-700">
                  {activeMembership.plan.maxGalleryImages}
                </p>
                <p className="text-xs text-gray-500 mt-1">Imágenes por anuncio</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold text-green-700">Incluido</p>
                <p className="text-xs text-gray-500 mt-1">Boosts y visibilidad</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <div className="flex justify-center gap-1">
                  {activeMembership.plan.hasFeaturedBadge && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {activeMembership.plan.hasSocialLinks && (
                    <LinkIcon className="h-5 w-5 text-green-600" />
                  )}
                  {activeMembership.plan.hasWebsiteLink && (
                    <Globe className="h-5 w-5 text-purple-500" />
                  )}
                  {!activeMembership.plan.hasFeaturedBadge &&
                    !activeMembership.plan.hasSocialLinks &&
                    !activeMembership.plan.hasWebsiteLink && (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Beneficios adicionales</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Gem className="mx-auto h-12 w-12 text-green-300" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Sin membresía activa
            </h2>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Adquiere una membresía para activar tu perfil y acceder a
              todos los beneficios exclusivos de Guía ZMG.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/planes">
                Adquirir membresía <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card id="planes">
        <CardHeader>
          <CardTitle className="text-lg">Comparativa de planes</CardTitle>
          <CardDescription>
            Elige el plan que mejor se adapte a tu negocio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isActive = activeMembership?.planId === plan.id
              const isZero = Number(plan.monthlyPrice) === 0

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${
                    isActive
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : plan.slug === "professional" && !activeMembership
                        ? "border-amber-300"
                        : ""
                  }`}
                >
                  {isActive && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-green-700 text-white">Actual</Badge>
                    </div>
                  )}
                  {plan.slug === "professional" && !activeMembership && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-amber-500 text-white">Recomendado</Badge>
                    </div>
                  )}
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3">
                      {planIcon[plan.slug] || <Store className="h-5 w-5 text-gray-400" />}
                      <h3 className="font-semibold">{plan.name}</h3>
                    </div>
                    <p className="text-2xl font-bold">
                      {isZero ? "Gratuito" : formatCurrency(Number(plan.monthlyPrice))}
                    </p>
                    {!isZero && (
                      <p className="text-xs text-gray-500 mb-3">MXN/mes</p>
                    )}
                    {plan.description && (
                      <p className="text-xs text-gray-400 mb-4">{plan.description}</p>
                    )}
                    <ul className="space-y-2 flex-1">
                      <li className="flex items-start gap-2 text-xs text-gray-600">
                        <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                        {plan.maxListings} anuncio{plan.maxListings !== 1 ? "s" : ""}
                      </li>
                      <li className="flex items-start gap-2 text-xs text-gray-600">
                        <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                        {plan.maxGalleryImages} imágenes por anuncio
                      </li>
                      <li className="flex items-start gap-2 text-xs text-gray-600">
                        <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                        —
                      </li>
                      {plan.hasFeaturedBadge && (
                        <li className="flex items-start gap-2 text-xs text-gray-600">
                          <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                          Badge destacado
                        </li>
                      )}
                      {plan.hasSocialLinks && (
                        <li className="flex items-start gap-2 text-xs text-gray-600">
                          <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                          Redes sociales
                        </li>
                      )}
                      {plan.hasWebsiteLink && (
                        <li className="flex items-start gap-2 text-xs text-gray-600">
                          <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                          Sitio web
                        </li>
                      )}
                    </ul>
                    {!isActive && (
                      <Link
                        href={`/checkout?plan=${plan.slug}&businessId=${businesses[0]?.id || ""}`}
                        className="mt-4"
                      >
                        <Button
                          variant={
                            plan.slug === "professional" && !activeMembership
                              ? "default"
                              : "outline"
                          }
                          className="w-full"
                        >
                          {isZero
                            ? "Seleccionar"
                            : activeMembership
                              ? "Cambiar a este plan"
                              : "Adquirir"}
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
