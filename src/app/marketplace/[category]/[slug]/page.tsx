export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getPublicAppUrl } from "@/lib/env"
import { MapPin, Phone, MessageCircle, Calendar, Eye, Star, Edit3 } from "@/lib/icons"
import { formatCurrency } from "@/lib/utils"
import { conditionLabel, conditionBadge } from "@/lib/marketplace-conditions"
import { ListingGallery } from "@/components/marketplace/listing-gallery"
import { ListingFavoriteButton } from "@/components/marketplace/listing-favorite-button"

const TYPE_LABELS: Record<string, string> = {
  SALE: "Venta", PURCHASE: "Compra", TRADE: "Intercambio", SERVICE: "Servicio",
  REQUEST: "Solicitud", EVENT: "Evento", PROMOTION: "Promoción",
}

interface ListingDetailProps {
  params: Promise<{ category: string; slug: string }>
}

export async function generateMetadata({ params }: ListingDetailProps) {
  const { category, slug } = await params
  try {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { slug },
      include: { category: true },
    })
    if (!listing) return { title: "No encontrado" }
    if (listing.category.slug !== category) {
      return {
        title: listing.title,
        alternates: { canonical: `${getPublicAppUrl()}/marketplace/${listing.category.slug}/${listing.slug}` },
        robots: { index: false, follow: false },
      }
    }
    return {
      title: `${listing.title} · Marketplace`,
      description: listing.description?.slice(0, 160) || `${listing.title} en Guadalajara. Precio: ${listing.price ? formatCurrency(Number(listing.price)) : "Contactar"}`,
      alternates: { canonical: `${getPublicAppUrl()}/marketplace/${listing.category.slug}/${listing.slug}` },
    }
  } catch {
    return { title: "Marketplace" }
  }
}

export default async function MarketplaceListingDetail({ params }: ListingDetailProps) {
  const { category, slug } = await params
  const listing = await prisma.marketplaceListing.findUnique({
    where: { slug },
    include: {
      category: true,
      municipality: true,
      user: { select: { id: true, name: true, image: true, createdAt: true } },
      images: { orderBy: { sortOrder: "asc" } },
      _count: { select: { favorites: true } },
    },
  })
  if (!listing || listing.deletedAt) notFound()

  const session = await auth()
  const isOwner = session?.user?.id === listing.userId
  const isAdmin = session?.user?.role === "ADMIN"
  const canEdit = isOwner || isAdmin

  // Solo se muestran públicamente los anuncios ACTIVOS. El dueño y el admin sí
  // pueden previsualizar los suyos aunque estén en revisión (PENDING/HIDDEN).
  if (listing.status !== "ACTIVE" && !canEdit) notFound()

  if (listing.category.slug !== category) {
    redirect(`/marketplace/${listing.category.slug}/${listing.slug}`)
  }

  const similar = await prisma.marketplaceListing.findMany({
    where: { categoryId: listing.categoryId, id: { not: listing.id }, status: "ACTIVE", deletedAt: null },
    take: 4,
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  })

  const sellerRating = await prisma.sellerReview.aggregate({
    where: { sellerId: listing.userId },
    _avg: { rating: true },
    _count: true,
  })

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/marketplace" className="hover:text-blue-600">Marketplace</Link>
            <span className="mx-2">/</span>
            <Link href={`/marketplace/${listing.category.slug}`} className="hover:text-blue-600">{listing.category.name}</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{listing.title}</span>
          </nav>

          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Images & Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery (navegable) */}
              <Card className="overflow-hidden">
                <ListingGallery images={listing.images} title={listing.title} />
              </Card>

              {/* Descripción + ubicación (el título/precio van en la columna derecha) */}
              <Card>
                <CardContent className="space-y-4 p-6">
                  {listing.description ? (
                    <div>
                      <h2 className="mb-2 text-sm font-semibold text-gray-900">Descripción</h2>
                      <p className="whitespace-pre-wrap text-sm text-gray-600">{listing.description}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Sin descripción.</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {[listing.neighborhood, listing.municipality?.name].filter(Boolean).join(", ") || "Zona Metropolitana de Guadalajara"}
                  </div>
                </CardContent>
              </Card>

              {/* Similar listings */}
              {similar.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Publicaciones similares</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {similar.map((s) => (
                      <Link key={s.id} href={`/marketplace/${listing.category.slug}/${s.slug}`}>
                        <Card className="group overflow-hidden transition-all hover:shadow-md">
                          <div className="aspect-[4/3] bg-gray-100">
                            {s.images[0] ? (
                              <div className="relative h-full w-full">
                                <Image src={s.images[0].url} alt={s.title} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="flex h-full items-center justify-center text-gray-300 text-3xl">📸</div>
                            )}
                          </div>
                          <CardContent className="p-3">
                            <h3 className="text-sm font-medium truncate">{s.title}</h3>
                            {s.price && <p className="text-sm font-bold text-blue-600">{formatCurrency(Number(s.price))}</p>}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="mt-6 lg:mt-0 space-y-4">
              {/* Título, precio y condición (estilo Marketplace) */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h1 className="text-xl font-bold leading-tight text-gray-900">{listing.title}</h1>
                    {canEdit && (
                      <Link
                        href={`/marketplace/${listing.category.slug}/${listing.slug}/editar`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Editar
                      </Link>
                    )}
                  </div>
                  {listing.price && (
                    <p className="mt-2 text-2xl font-bold text-blue-600">{formatCurrency(Number(listing.price))}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <Badge variant="outline">{TYPE_LABELS[listing.type] ?? listing.type}</Badge>
                    {listing.condition && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${conditionBadge(listing.condition)}`}>
                        {conditionLabel(listing.condition)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(listing.createdAt).toLocaleDateString("es-MX")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {listing.views}
                    </span>
                  </div>
                  {listing.status !== "ACTIVE" && canEdit && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                      Vista previa — esta publicación está en estado {listing.status}. Solo tú (y el equipo) la ven así.
                    </p>
                  )}
                  {!isOwner && (
                    <div className="mt-4">
                      <ListingFavoriteButton listingId={listing.id} isAuthed={!!session?.user} />
                    </div>
                  )}
                  {isOwner && (listing._count?.favorites ?? 0) > 0 && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {listing._count.favorites}{" "}
                      {listing._count.favorites === 1 ? "persona guardó" : "personas guardaron"} esta publicación
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Seller Card */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                      {listing.user.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{listing.user.name || "Usuario"}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {sellerRating._avg.rating ? (
                          <>
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {sellerRating._avg.rating.toFixed(1)} ({sellerRating._count} reseñas)
                          </>
                        ) : (
                          "Sin reseñas"
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold text-gray-900">Contactar al vendedor</h3>
                  {/* Privacidad: no se muestra el teléfono ni el correo como texto.
                      WhatsApp es el canal principal; "Llamar" y "Enviar correo" abren
                      la app sin exponer el dato en la página. */}
                  {listing.whatsapp && (
                    <a
                      href={`https://wa.me/52${listing.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola, vi tu publicación "${listing.title}" en Guía ZMG`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-600 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Enviar mensaje por WhatsApp
                    </a>
                  )}
                  {listing.phone && (
                    <a
                      href={`tel:${listing.phone}`}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      Llamar
                    </a>
                  )}
                  {!listing.whatsapp && !listing.phone && (
                    <p className="text-sm text-gray-400 text-center">Sin información de contacto</p>
                  )}
                  <p className="pt-1 text-center text-[11px] leading-snug text-gray-400">
                    Trata directo con el vendedor. No compartas datos de pago por adelantado.
                  </p>
                </CardContent>
              </Card>

              {/* Report */}
              <p className="text-center text-xs text-gray-400">
                ¿Ves algo sospechoso?{" "}
                <Link href={`/reportar?type=marketplace&id=${listing.slug}`} className="text-blue-600 hover:underline">
                  Reportar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
