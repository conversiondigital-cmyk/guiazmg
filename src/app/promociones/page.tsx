import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tag, Clock, Gift, ArrowRight } from "@/lib/icons"

export const metadata: Metadata = {
  title: "Promociones",
  description: "Descubre las promociones y ofertas especiales de negocios registrados en Guía ZMG.",
}

// Se revalida cada 5 min: las promociones cambian, pero la página es pública.
export const revalidate = 300

const fmt = (d: Date) => new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "long" })

type PromoCard = {
  id: string
  title: string
  description: string | null
  code: string | null
  endDate: Date | null
  profile: { name: string; slug: string; isBoosted: boolean; category: { name: string } | null }
}

function PromoCard({ promo, compact = false }: { promo: PromoCard; compact?: boolean }) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {promo.profile.category?.name && (
              <Badge className="mb-2 bg-green-700 text-white">{promo.profile.category.name}</Badge>
            )}
            <CardTitle className={compact ? "text-base" : "text-lg"}>{promo.title}</CardTitle>
            <CardDescription className="mt-1 text-sm font-semibold text-gray-700">
              {promo.profile.name}
            </CardDescription>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <Tag className="h-5 w-5 text-amber-600" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-4">
        {promo.description && <p className="text-sm text-gray-600">{promo.description}</p>}
        {promo.code && (
          <div className="mt-3">
            <span className="text-xs text-gray-500">Código: </span>
            <code className="rounded bg-amber-100 px-2 py-0.5 font-mono text-sm text-amber-800">{promo.code}</code>
          </div>
        )}
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
          {promo.endDate ? (
            <>
              <Clock className="h-4 w-4" /> Válido hasta {fmt(promo.endDate)}
            </>
          ) : (
            <>
              <Clock className="h-4 w-4" /> Sin fecha límite
            </>
          )}
        </div>
        <Link href={`/perfil/${promo.profile.slug}`} className="mt-4 block">
          <Button className="w-full">Ver negocio</Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export default async function PromocionesPage() {
  const now = new Date()
  // Promociones REALES: cupones activos, no vencidos, de negocios visibles.
  const promotions = (await prisma.coupon
    .findMany({
      where: {
        isActive: true,
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        profile: { status: "ACTIVE", deletedAt: null },
      },
      select: {
        id: true,
        title: true,
        description: true,
        code: true,
        endDate: true,
        profile: {
          select: {
            name: true,
            slug: true,
            isBoosted: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 60,
    })
    .catch(() => [])) as PromoCard[]

  // Destacadas = promociones de negocios con boost vigente.
  const featured = promotions.filter((p) => p.profile.isBoosted)
  const regular = promotions.filter((p) => !p.profile.isBoosted)

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-green-900 py-12">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">Exclusivo para ti</p>
              <h1 className="text-3xl font-black text-white sm:text-4xl">Promociones y Ofertas</h1>
              <p className="mt-4 text-xl text-green-200">
                Las promociones reales de los negocios registrados en Guía ZMG
              </p>
            </div>
          </div>
        </section>

        {/* Banner de la promo de registro (60 días gratis) */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/promociones/registro"
            className="group flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#006c49] to-[#00583b] p-6 shadow-lg transition-shadow hover:shadow-xl"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Gift className="h-7 w-7" />
              </span>
              <div>
                <p className="text-lg font-bold text-white sm:text-xl">
                  ¿Tienes un negocio? Pruébalo 60 días gratis
                </p>
                <p className="mt-0.5 text-sm text-white/80">
                  Registra tu negocio y activa tu plan Emprendedor o Negocio con tu código de invitación.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#006c49] transition-transform group-hover:translate-x-0.5">
              Ver promoción <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </section>

        {promotions.length === 0 ? (
          <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <Tag className="h-6 w-6 text-amber-500" />
            </span>
            <h2 className="text-2xl font-bold text-gray-900">Aún no hay promociones activas</h2>
            <p className="mx-auto mt-3 max-w-md text-gray-600">
              Cuando los negocios publiquen sus ofertas, aparecerán aquí. Vuelve pronto.
            </p>
          </section>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold tracking-tight">Ofertas Destacadas</h2>
                  <p className="mt-2 text-gray-600">Las promociones más visibles del momento</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {featured.map((promo) => (
                    <PromoCard key={promo.id} promo={promo} />
                  ))}
                </div>
              </section>
            )}

            {regular.length > 0 && (
              <section className="bg-gray-50 py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight">
                      {featured.length > 0 ? "Todas las Promociones" : "Promociones activas"}
                    </h2>
                    <p className="mt-2 text-gray-600">Explora todas las ofertas disponibles</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {regular.map((promo) => (
                      <PromoCard key={promo.id} promo={promo} compact />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold">¿Eres dueño de un negocio?</h2>
            <p className="mt-4 text-lg text-gray-600">
              Publica tus promociones desde tu panel y atrae más clientes con Guía ZMG.
            </p>
            <Link href="/dashboard/promociones" className="mt-6 inline-block">
              <Button size="lg">Publicar una promoción</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
