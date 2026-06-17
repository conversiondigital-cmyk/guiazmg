export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Heart, Star, Package, Bell, Search, ArrowRight, Store, Rocket, TrendingUp } from "lucide-react"
import { Metadata } from "next"
import { getCategories, getFeaturedBusinesses } from "@/lib/queries"
import { CategoryGrid } from "@/components/home/category-grid"
import { FeaturedBusinesses } from "@/components/home/featured-businesses"

export const metadata: Metadata = { title: "Mi cuenta | Guía ZMG" }

export default async function CuentaPage() {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id
  const firstName = (session.user.name ?? "").split(" ")[0] || "de nuevo"

  let categories: Awaited<ReturnType<typeof getCategories>> = []
  let featured: Awaited<ReturnType<typeof getFeaturedBusinesses>> = []
  let favCount = 0,
    reviewCount = 0,
    marketplaceCount = 0,
    notifCount = 0
  try {
    ;[categories, featured, favCount, reviewCount, marketplaceCount, notifCount] = await Promise.all([
      getCategories(),
      getFeaturedBusinesses(6),
      prisma.favorite.count({ where: { userId } }),
      prisma.review.count({ where: { userId } }),
      prisma.marketplaceListing.count({ where: { userId, deletedAt: null } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ])
  } catch {
    // BD no disponible — renderiza con estado vacío
  }

  const stats = [
    { label: "Favoritos", value: favCount, href: "/cuenta/favoritos", icon: Heart, tint: "bg-rose-50 text-rose-600" },
    { label: "Reseñas", value: reviewCount, href: "/cuenta/resenas", icon: Star, tint: "bg-amber-50 text-amber-600" },
    { label: "Marketplace", value: marketplaceCount, href: "/cuenta/marketplace", icon: Package, tint: "bg-blue-50 text-blue-600" },
    { label: "Sin leer", value: notifCount, href: "/cuenta/notificaciones", icon: Bell, tint: "bg-[#d8f0e6] text-[#0f7a52]" },
  ]

  return (
    <div className="space-y-12" style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}>
      {/* Hero de bienvenida */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#003527] via-[#064e3b] to-[#006c49] p-8 text-white shadow-[0_10px_40px_-10px_rgba(0,53,39,0.5)] md:p-12">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#4edea3]">Bienvenido de vuelta</p>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight md:text-5xl">Hola, {firstName}</h1>
          <p className="mb-7 max-w-xl text-white/85">
            Descubre los mejores negocios locales, guarda tus favoritos y apoya el crecimiento de tu comunidad en Guadalajara.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-full bg-[#4edea3] px-7 py-3.5 font-semibold text-[#003527] transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Search className="h-5 w-5" /> Explorar negocios
            </Link>
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              <TrendingUp className="h-5 w-5" /> Ver tendencias
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#4edea3]/10 blur-3xl" />
      </section>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value, href, icon: Icon, tint }) => (
          <Link
            key={href}
            href={href}
            className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_6px_24px_rgba(11,28,48,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(11,28,48,0.10)]"
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${tint}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-extrabold text-[#0b1c30]">{value}</p>
            <p className="text-sm text-[#404944]">{label}</p>
          </Link>
        ))}
      </div>

      {/* Categorías Populares */}
      {categories.length > 0 && <CategoryGrid categories={categories as never} />}

      {/* Negocios Destacados */}
      {featured.length > 0 && <FeaturedBusinesses businesses={featured} />}

      {/* CTA — registrar negocio */}
      <section className="relative overflow-hidden rounded-[32px] bg-[#064e3b] p-8 text-white md:p-12">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4edea3] text-[#003527]">
            <Store className="h-7 w-7" />
          </div>
          <h2 className="mb-3 text-2xl font-extrabold md:text-3xl">¿Tienes un negocio o emprendimiento?</h2>
          <p className="mb-8 max-w-xl text-white/80">
            Únete a la red de negocios más grande de la Zona Metropolitana de Guadalajara y conecta con miles de clientes potenciales cada día.
          </p>
          <Link
            href="/registrar-negocio"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#4edea3] px-8 py-4 font-semibold text-[#003527] transition-all hover:-translate-y-1 hover:shadow-2xl"
          >
            Registrar mi negocio ahora <Rocket className="h-5 w-5" />
          </Link>
        </div>
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-[#4edea3]/10 blur-3xl" />
      </section>
    </div>
  )
}
