"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, Camera, MessageCircle, Zap, Star } from "@/lib/icons"
import Link from "next/link"

const tips = [
  { icon: Camera, label: "Completa tu perfil", action: "Agrega más imágenes", href: "/dashboard/negocio" },
  { icon: MessageCircle, label: "Responde reseñas", action: "Mejora tu reputación", href: "/dashboard/resenas" },
  { icon: Zap, label: "Activa un boost", action: "Destaca tu perfil", href: "/dashboard/boosts" },
  { icon: Star, label: "Actualiza a Premium", action: "Máxima prioridad", href: "/dashboard/membresia" },
]

export function GamificationTips() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Recomendaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tips.map((tip) => (
          <Link
            key={tip.label}
            href={tip.href}
            className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:border-green-100 hover:bg-green-50 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <tip.icon className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{tip.label}</p>
              <p className="text-xs text-gray-500">{tip.action}</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
