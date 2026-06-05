export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Gift,
  Users,
  TrendingUp,
  Link as LinkIcon,
} from "@/lib/icons"
import { getPublicAppUrl } from "@/lib/env"
import { ReferralCodeDisplay } from "./referral-code"

function generateCode(userId: string): string {
  const prefix = "GZMG"
  const short = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()
  return `${prefix}-${short}`
}

export default async function ReferidosPage() {
  const session = await auth()
  if (!session?.user?.id) return null
  const baseUrl = getPublicAppUrl()

  const existingReferral = await prisma.referral.findFirst({
    where: { referrerId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  const code = existingReferral?.code || generateCode(session.user.id)

  if (!existingReferral) {
    await prisma.referral.create({
      data: {
        referrerId: session.user.id,
        code,
        status: "PENDING",
      },
    })
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  const sentCount = referrals.length
  const convertedCount = referrals.filter((r) => r.status === "CONVERTED" || r.status === "REWARDED").length
  const rewardsEarned = referrals
    .filter((r) => r.rewardValue)
    .reduce((sum, r) => sum + (r.rewardValue || 0), 0)

  const shareUrl = `${baseUrl}/auth/register?ref=${code}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referidos</h1>
        <p className="text-gray-500">
          Invita a otros negocios y gana recompensas
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Enviados
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{sentCount}</p>
              </div>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Convertidos
                </p>
                <p className="text-2xl font-bold text-green-600 mt-1">{convertedCount}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Recompensas
                </p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {rewardsEarned > 0 ? `${rewardsEarned}` : "—"}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tu código de referido</CardTitle>
          <CardDescription>
            Comparte este código con otros negocios para que se registren en Guía ZMG
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReferralCodeDisplay code={code} shareUrl={shareUrl} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial de referidos</CardTitle>
          <CardDescription>
            {referrals.length > 0
              ? `${referrals.length} referido${referrals.length !== 1 ? "s" : ""}`
              : "Aún no has referido a nadie"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                Comparte tu código de referido y gana recompensas cuando otros negocios se registren.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <Badge
                      variant="outline"
                      className={
                        r.status === "REWARDED"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : r.status === "CONVERTED"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-yellow-100 text-yellow-700 border-yellow-200"
                      }
                    >
                      {r.status === "PENDING" && "Pendiente"}
                      {r.status === "CONVERTED" && "Registrado"}
                      {r.status === "REWARDED" && "Recompensado"}
                    </Badge>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-500">
                      {r.createdAt.toLocaleDateString("es-MX")}
                    </p>
                    {r.rewardValue && (
                      <p className="text-green-600 font-medium">
                        +{r.rewardValue}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <LinkIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">1. Comparte</h3>
              <p className="text-sm text-gray-500 mt-1">
                Comparte tu código de referido con otros negocios dueños de la zona.
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">2. Se registran</h3>
              <p className="text-sm text-gray-500 mt-1">
                Cuando un negocio se registra con tu código, se marca como referido.
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">3. Gana recompensas</h3>
              <p className="text-sm text-gray-500 mt-1">
                Por cada referido que se convierta, recibirás recompensas para impulsar tu visibilidad.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
