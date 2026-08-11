export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Heart, Star, Package, Bell, Search, ArrowRight, Store, Rocket, TrendingUp, Gift } from "lucide-react"
import { Metadata } from "next"
import { getCategories, getFeaturedBusinesses } from "@/lib/queries"
import { getActivePromoCoupons } from "@/lib/coupons/promo-coupons"
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

  // Promo de lanzamiento (días gratis). Solo se anuncia mientras HAYA cupones
  // disponibles: si un plan se agota, se anuncia solo el que queda; si se agotan
  // ambos, no aparece el aviso. El enlace lleva ?promo=1 para autocompletar el
  // código al final del registro.
  const promo = await getActivePromoCoupons().catch(() => ({ EMPRENDEDOR: null, NEGOCIO: null }))
  const promoDays = promo.NEGOCIO?.days ?? promo.EMPRENDEDOR?.days ?? 0
  const promoPlans = [promo.NEGOCIO ? "Negocio" : null, promo.EMPRENDEDOR ? "Emprendedor" : null].filter(
    Boolean,
  ) as string[]
  const promoPlanLabel =
    promoPlans.length === 2 ? "Emprendedor o Negocio" : promoPlans[0] ?? ""

  const stats = [
    { label: "Favoritos", value: favCount, href: "/cuenta/favoritos", icon: Heart, tint: "bg-rose-50 text-rose-600" },
    { label: "Reseñas", value: reviewCount, href: "/cuenta/resenas", icon: Star, tint: "bg-amber-50 text-amber-600" },
    { label: "Marketplace", value: marketplaceCount, href: "/cuenta/marketplace", icon: Package, tint: "bg-blue-50 text-blue-600" },
    { label: "Sin leer", value: notifCount, href: "/cuenta/notificaciones", icon: Bell, tint: "bg-[#d8f0e6] text-[#0f7a52]" },
  ]

  return (
    <div className="space-y-6">
      {/* Hero de bienvenida — compacto */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#003527] via-[#064e3b] to-[#006c49] px-5 py-4 text-white shadow-[0_8px_30px_-12px_rgba(0,53,39,0.5)]">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold leading-tight md:text-xl">Hola, {firstName}</h1>
            <p className="mt-0.5 text-sm text-white/80">
              Descubre negocios locales y apoya a tu comunidad en Guadalajara.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-full bg-[#4edea3] px-4 py-2 text-sm font-semibold text-[#003527] transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Search className="h-4 w-4" /> Explorar
            </Link>
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              <TrendingUp className="h-4 w-4" /> Tendencias
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#4edea3]/10 blur-3xl" />
      </section>

      {/* Buscador del directorio (form GET → /search, sin JS) */}
      <form action="/search" method="get" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            name="q"
            placeholder="Busca negocios, servicios o categorías…"
            aria-label="Buscar en el directorio"
            className="h-11 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-3 text-sm shadow-sm outline-none transition-colors focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-[#006c49] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#00583b]"
        >
          <Search className="h-4 w-4" /> Buscar
        </button>
      </form>

      {/* Resumen rápido — tarjetas compactas horizontales */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, href, icon: Icon, tint }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-[0_4px_16px_rgba(11,28,48,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(11,28,48,0.10)]"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tint}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-extrabold leading-none text-[#0b1c30]">{value}</p>
              <p className="mt-1 truncate text-xs text-[#404944]">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Aviso de la promo de lanzamiento — solo si aún quedan códigos */}
      {promoPlans.length > 0 && promoDays > 0 && (
        <Link
          href="/registrar-negocio?promo=1"
          className="group flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#006c49] to-[#00583b] px-5 py-4 text-white shadow-[0_8px_30px_-12px_rgba(0,53,39,0.5)] transition-shadow hover:shadow-xl"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Gift className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold sm:text-base">
                Promoción de lanzamiento — {promoDays} días gratis
              </p>
              <p className="mt-0.5 text-xs text-white/80 sm:text-sm">
                Registra tu negocio y activa tu plan {promoPlanLabel} sin pagar los primeros{" "}
                {promoDays} días. El código se aplica solo al registrarte.
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#006c49] transition-transform group-hover:translate-x-0.5">
            Aprovechar <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      )}

      {/* Categorías Populares */}
      {categories.length > 0 && <CategoryGrid categories={categories as never} bare />}

      {/* Negocios Destacados */}
      {featured.length > 0 && <FeaturedBusinesses businesses={featured} bare />}

      {/* CTA — registrar negocio */}
      <section className="relative overflow-hidden rounded-[32px] bg-[#064e3b] p-6 text-white md:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4edea3] text-[#003527]">
            <Store className="h-7 w-7" />
          </div>
          <h2 className="mb-2 text-xl font-extrabold md:text-2xl">¿Tienes un negocio o emprendimiento?</h2>
          <p className="mb-8 max-w-xl text-white/80">
            Únete a la red de negocios más grande de la Zona Metropolitana de Guadalajara y conecta con miles de clientes potenciales cada día.
          </p>
          <Link
            href="/onboarding/vendedor"
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
