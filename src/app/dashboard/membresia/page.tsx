export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Zap, Check, ArrowRight, Calendar, Gem, CheckCircle, Store } from "@/lib/icons"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { CouponRedeemForm } from "@/components/dashboard/coupon-redeem-form"
import { CancelMembershipToggle } from "@/components/dashboard/cancel-membership-toggle"

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "ACTIVA", color: "bg-green-100 text-green-700 border-green-300" },
  PAST_DUE: { label: "VENCIDA", color: "bg-red-100 text-red-700 border-red-300" },
  EXPIRED: { label: "EXPIRADA", color: "bg-gray-100 text-gray-700 border-gray-300" },
  CANCELLED: { label: "CANCELADA", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  TRIAL: { label: "PRUEBA", color: "bg-green-100 text-green-800 border-green-300" },
}

const planIcon: Record<string, React.ReactNode> = {
  emprendedor: <Zap className="h-5 w-5 text-green-600" />,
  negocio: <Crown className="h-5 w-5 text-amber-500" />,
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
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white overflow-hidden">
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

                  <div className="mt-4">
                    <CancelMembershipToggle
                      businessId={activeMembership.businessId}
                      initialCancelAtPeriodEnd={activeMembership.cancelAtPeriodEnd}
                      periodEnd={activeMembership.currentPeriodEnd.toLocaleDateString("es-MX")}
                    />
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
                <p className="text-xs text-gray-500 mt-1">Productos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold text-green-700">
                  {activeMembership.plan.maxServices}
                </p>
                <p className="text-xs text-gray-500 mt-1">Servicios</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-bold text-green-700">
                  {activeMembership.plan.maxGalleryImages}
                </p>
                <p className="text-xs text-gray-500 mt-1">Imágenes por publicación</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="mb-2.5 text-center text-xs text-gray-500">Beneficios adicionales</p>
                <ul className="space-y-1.5 text-xs">
                  {[
                    { on: true, label: "Visibilidad prioritaria" },
                    { on: activeMembership.plan.hasFeaturedBadge, label: "Badge destacado" },
                    { on: activeMembership.plan.hasSocialLinks, label: "Redes sociales" },
                    { on: activeMembership.plan.hasWebsiteLink, label: "Sitio web propio" },
                  ].map((b) => (
                    <li
                      key={b.label}
                      className={`flex items-center gap-1.5 ${b.on ? "text-gray-700" : "text-gray-300"}`}
                    >
                      {b.on ? (
                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      ) : (
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-gray-200" />
                      )}
                      {b.label}
                    </li>
                  ))}
                </ul>
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

      {businesses.length > 0 && (
        <CouponRedeemForm businesses={businesses.map((b) => ({ id: b.id, name: b.name }))} />
      )}

      <Card id="planes">
        <CardHeader>
          <CardTitle className="text-lg">Comparativa de planes</CardTitle>
          <CardDescription>
            Elige el plan que mejor se adapte a tu negocio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
            {plans.map((plan) => {
              const isActive = activeMembership?.planId === plan.id
              const recommended = plan.slug === "negocio" && !activeMembership
              const feats = [
                `${plan.maxListings} productos y ${plan.maxServices} servicios`,
                `${plan.maxGalleryImages} imágenes por publicación`,
                ...(plan.hasFeaturedBadge ? ["Badge destacado"] : []),
                ...(plan.hasSocialLinks ? ["Redes sociales"] : []),
                ...(plan.hasWebsiteLink ? ["Sitio web"] : []),
              ]
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border bg-white p-6 transition-shadow hover:shadow-md ${
                    isActive
                      ? "border-green-600 ring-1 ring-green-200"
                      : recommended
                        ? "border-green-500 ring-1 ring-green-100"
                        : "border-gray-200"
                  }`}
                >
                  {(isActive || recommended) && (
                    <span
                      className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isActive ? "bg-green-100 text-green-700" : "bg-green-600 text-white"
                      }`}
                    >
                      {isActive ? "Plan actual" : "Recomendado"}
                    </span>
                  )}

                  <div className="flex items-center gap-2 pr-24">
                    {planIcon[plan.slug] || <Store className="h-5 w-5 text-green-600" />}
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  </div>
                  {plan.description && (
                    <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  )}

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold tracking-tight text-gray-900">
                      {formatCurrency(Number(plan.monthlyPrice))}
                    </span>
                    <span className="text-sm font-medium text-gray-400">/mes</span>
                  </div>
                  <p className="text-xs text-gray-400">MXN · facturación mensual</p>

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {feats.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {!isActive && (
                    <Link
                      href={`/checkout?plan=${plan.slug}&businessId=${businesses[0]?.id || ""}`}
                      className="mt-6 block"
                    >
                      <Button
                        variant={recommended ? "default" : "outline"}
                        size="lg"
                        className="w-full rounded-lg"
                      >
                        {activeMembership ? "Cambiar a este plan" : `Elegir ${plan.name}`}
                      </Button>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
