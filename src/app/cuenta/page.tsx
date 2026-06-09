export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Heart, Star, Package, MessageCircle, Search, Store, ArrowRight } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Mi cuenta | Guía ZMG" }

export default async function CuentaPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = (session.user as any).id

  const [favCount, reviewCount, marketplaceCount, notifCount] = await Promise.all([
    prisma.favorite.count({ where: { userId } }),
    prisma.review.count({ where: { userId } }),
    prisma.marketplaceListing.count({ where: { userId, deletedAt: null } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ])

  const recentNotifs = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, type: true, message: true, isRead: true, createdAt: true },
  })

  const quickStats = [
    { label: "Favoritos",    value: favCount,         href: "/cuenta/favoritos",    icon: Heart,          color: "text-rose-600  bg-rose-50" },
    { label: "Reseñas",      value: reviewCount,      href: "/cuenta/resenas",      icon: Star,           color: "text-amber-600 bg-amber-50" },
    { label: "Marketplace",  value: marketplaceCount, href: "/cuenta/marketplace",  icon: Package,        color: "text-blue-600  bg-blue-50" },
    { label: "Sin leer",     value: notifCount,       href: "/cuenta/notificaciones",icon: MessageCircle, color: "text-green-700 bg-green-50" },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="rounded-2xl bg-green-900 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:"radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",backgroundSize:"50px 50px"}} />
        <div className="relative">
          <p className="text-green-300 text-sm font-medium mb-1">Bienvenido de vuelta</p>
          <h1 className="text-2xl font-black">{session.user.name ?? "Usuario"}</h1>
          <p className="text-green-300 text-sm mt-2">Explora negocios locales, guarda tus favoritos y deja reseñas.</p>
          <Link
            href="/search"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
          >
            <Search className="h-4 w-4" />
            Explorar negocios
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickStats.map(({ label, value, href, icon: Icon, color }) => (
          <Link key={href} href={href} className="rounded-2xl bg-white border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color} mb-3`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent notifications */}
      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Notificaciones recientes</h2>
          <Link href="/cuenta/notificaciones" className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900">
            Ver todas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentNotifs.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No hay notificaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentNotifs.map((n) => (
              <div key={n.id} className={`flex items-start gap-3 px-5 py-3 ${n.isRead ? "" : "bg-green-50/40"}`}>
                {!n.isRead && <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 line-clamp-1">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA — register business */}
      <div className="rounded-2xl border border-dashed border-green-200 bg-green-50 p-6 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-gray-900">¿Tienes un negocio o emprendimiento?</p>
          <p className="text-sm text-gray-500 mt-0.5">Regístralo en Guía ZMG y empieza a recibir clientes locales.</p>
          <Link
            href="/registrar-negocio"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 transition-colors"
          >
            Registrar mi negocio <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
