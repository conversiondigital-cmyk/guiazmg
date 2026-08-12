import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireConsent } from "@/lib/auth/consent"
import { prisma } from "@/lib/prisma"
import { businessSchema } from "@/lib/validations"
import { slugify, generateUniqueSlug } from "@/lib/utils"
import { createNotification } from "@/lib/notifications/create"
import { sendEmail, getAdminNotifyEmail, sendBusinessActivatedEmail } from "@/lib/email"
import { getPublicAppUrl } from "@/lib/env"
import { redeemMembershipCoupon } from "@/lib/coupons/redeem-membership"
import { z } from "zod"

const blankToNull = (v: unknown) => (v === "" || v === undefined ? null : v)
const optText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional())
const optUrl = z.preprocess(blankToNull, z.string().trim().url().max(500).nullable().optional())

// URL de imagen: acepta http(s) absoluta (R2 en prod) o ruta relativa /uploads
// (storage local en dev). El valor proviene de nuestro /api/upload, no es texto
// libre; aun así se valida el formato.
const imageUrl = z.string().trim().max(1000).refine(
  (v) => /^https?:\/\//.test(v) || v.startsWith("/"),
  "URL de imagen inválida"
)
const optImage = z.preprocess(blankToNull, imageUrl.nullable().optional())

// Un renglón de horario (una fila por día de la semana).
const hourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  opensAt: z.preprocess(blankToNull, z.string().trim().regex(/^\d{2}:\d{2}$/).nullable().optional()),
  closesAt: z.preprocess(blankToNull, z.string().trim().regex(/^\d{2}:\d{2}$/).nullable().optional()),
  isClosed: z.boolean().optional(),
})

// Campos que el DUEÑO puede editar. Texto/enlaces, categoría, subcategoría y
// horarios. La ubicación geo (lat/lng), el estado y la verificación NO se
// editan por aquí.
const businessUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  shortDescription: optText(200),
  description: optText(5000),
  phone: optText(30),
  whatsapp: optText(30),
  email: z.preprocess(blankToNull, z.string().trim().email().nullable().optional()),
  websiteUrl: optUrl,
  facebookUrl: optUrl,
  instagramUrl: optUrl,
  tiktokUrl: optUrl,
  youtubeUrl: optUrl,
  linkedinUrl: optUrl,
  addressText: optText(300),
  postalCode: optText(12),
  googleMapsUrl: optUrl,
  wazeUrl: optUrl,
  categoryId: z.string().min(1).optional(),
  subcategoryId: z.preprocess(blankToNull, z.string().nullable().optional()),
  hours: z.array(hourSchema).max(7).optional(),
  logoUrl: optImage,
  coverImageUrl: optImage,
  images: z.array(imageUrl).max(12).optional(),
  latitude: z.preprocess(blankToNull, z.coerce.number().min(-90).max(90).nullable().optional()),
  longitude: z.preprocess(blankToNull, z.coerce.number().min(-180).max(180).nullable().optional()),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const consent = await requireConsent()
    if (!consent.ok) return NextResponse.json({ error: consent.error }, { status: consent.status })

    // Regla: solo un negocio por usuario.
    const owned = await prisma.profile.findFirst({
      where: { ownerId: session.user.id, deletedAt: null },
      select: { id: true },
    })
    if (owned) {
      return NextResponse.json(
        { error: "Ya tienes un negocio registrado. Solo se permite uno por cuenta." },
        { status: 409 }
      )
    }

    const body = await request.json()
    const validation = businessSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Regla: NO se permiten dos negocios con el mismo nombre (comparación sin
    // distinguir mayúsculas/acentos vía slug del nombre). Las sucursales se
    // gestionan por separado: se pide contactar al equipo.
    const nameSlug = slugify(data.name)
    const dupName = await prisma.profile.findFirst({
      where: { slug: { equals: nameSlug }, deletedAt: null },
      select: { id: true },
    })
    if (dupName) {
      return NextResponse.json(
        {
          error:
            "Ya existe un negocio con ese nombre. Si es una sucursal, contáctanos para agregarla.",
          code: "DUPLICATE_NAME",
        },
        { status: 409 }
      )
    }

    // Slug único legible (nombre, nombre-2, nombre-3…). Con la regla de nombre
    // único, el sufijo casi no se usa, pero se mantiene como salvaguarda de carreras.
    const slug = await generateUniqueSlug(nameSlug, async (s) =>
      Boolean(await prisma.profile.findUnique({ where: { slug: s }, select: { id: true } }))
    )

    const business = await prisma.profile.create({
      data: {
        // EMPRENDEDOR o NEGOCIO (default NEGOCIO si no viene, para compatibilidad).
        profileType: data.profileType ?? "NEGOCIO",
        // Emprendedor: por defecto sin local; Negocio: con local. El wizard puede
        // sobreescribirlo. Modalidades y zona de cobertura (sobre todo emprendedor).
        hasPhysicalLocation: data.hasPhysicalLocation ?? data.profileType !== "EMPRENDEDOR",
        serviceModes: data.serviceModes ?? [],
        coverageArea: data.coverageArea || null,
        operationModel: data.operationModel || null,
        name: data.name,
        shortDescription: data.shortDescription,
        description: data.description,
        phone: data.phone,
        whatsapp: data.whatsapp,
        email: data.email,
        websiteUrl: data.websiteUrl,
        facebookUrl: data.facebookUrl,
        instagramUrl: data.instagramUrl,
        tiktokUrl: data.tiktokUrl,
        googleMapsUrl: data.googleMapsUrl,
        wazeUrl: data.wazeUrl,
        addressText: data.addressText,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        municipalityId: data.municipalityId,
        neighborhoodId: data.neighborhoodId,
        slug,
        ownerId: session.user.id,
        // Entra a la cola de aprobación del admin.
        status: "PENDING_REVIEW",
        hours: data.hours
          ? {
              createMany: {
                data: data.hours.map((h) => ({
                  dayOfWeek: h.dayOfWeek,
                  opensAt: h.opensAt,
                  closesAt: h.closesAt,
                })),
              },
            }
          : undefined,
      },
    })

    // Promueve al usuario a BUSINESS_OWNER (si aún es USER) para que su panel
    // pase a ser el dashboard del negocio. La sesión (JWT) puede tardar en
    // reflejarlo, pero el acceso al dashboard también se valida por propiedad,
    // así que el dueño entra a administrar su negocio de inmediato.
    try {
      const current = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
      if (!current?.role || current.role === "USER") {
        await prisma.user.update({ where: { id: session.user.id }, data: { role: "BUSINESS_OWNER" } })
      }
    } catch (e) {
      console.error("[BUSINESS_ROLE_PROMOTE]", e instanceof Error ? e.message : e)
    }

    // Avisa a los administradores (notificación in-app + correo) que hay un
    // negocio nuevo por aprobar. Nunca rompe el registro si algo falla.
    try {
      const reviewUrl = `${getPublicAppUrl()}/admin/negocios/${business.id}`
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { id: true, email: true },
      })
      await Promise.all(
        admins.map((a) =>
          createNotification({
            userId: a.id,
            type: "SYSTEM",
            title: "Nuevo negocio por aprobar",
            message: `${data.name} se registró y espera aprobación.`,
            link: `/admin/negocios/${business.id}`,
          })
        )
      )
      // Correo: UNA sola vez al buzón de contacto (contacto@), no al login de cada admin.
      const notifyEmail = await getAdminNotifyEmail()
      await sendEmail(notifyEmail, "business_registered", {
        businessName: data.name,
        ownerName: session.user?.name || "",
        reviewUrl,
      })
    } catch (e) {
      console.error("[BUSINESS_REGISTER_NOTIFY]", e instanceof Error ? e.message : e)
    }

    // Código de invitación (cupón de días gratis): si vino uno, se canjea aquí
    // para activar la membresía de prueba SIN pago. Si el código es inválido no se
    // rompe el registro; se informa para que lo canjee después en el panel.
    let coupon: { applied: boolean; days?: number; planName?: string; error?: string } = { applied: false }
    if (data.invitationCode && data.invitationCode.trim()) {
      const res = await redeemMembershipCoupon({
        code: data.invitationCode,
        businessId: business.id,
        userId: session.user.id,
      })
      if (res.ok) {
        coupon = { applied: true, days: res.days, planName: res.planName }
        await createNotification({
          userId: session.user.id,
          type: "PAYMENT",
          title: "Prueba activada",
          message: `Activaste ${res.planName} gratis por ${res.days} días en "${data.name}".`,
        }).catch(() => {})
        // El cupón dejó el negocio ACTIVO y visible: avisa al dueño por correo.
        if (session.user.email) {
          await sendBusinessActivatedEmail(
            session.user.email,
            { businessName: data.name, ownerName: session.user.name, planName: res.planName },
            session.user.id,
          ).catch(() => {})
        }
      } else {
        coupon = { applied: false, error: res.error }
      }
    }

    return NextResponse.json({ id: business.id, slug: business.slug, coupon }, { status: 201 })
  } catch (error) {
    console.error("[BUSINESS_CREATE]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear el negocio" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const businesses = await prisma.profile.findMany({
      where: { ownerId: session.user.id },
      include: {
        municipality: true,
        neighborhood: true,
        category: true,
        memberships: { include: { plan: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(businesses)
  } catch {
    return NextResponse.json({ error: "Error al obtener negocios" }, { status: 500 })
  }
}

// El dueño edita su propio negocio (relación 1:1 por ownerId).
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const business = await prisma.profile.findFirst({
      where: { ownerId: session.user.id, deletedAt: null },
      select: { id: true, categoryId: true, subcategoryId: true },
    })
    if (!business) {
      return NextResponse.json({ error: "No tienes un negocio registrado" }, { status: 404 })
    }

    const parsed = businessUpdateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
    }
    const { categoryId, subcategoryId, hours, images, ...rest } = parsed.data

    // Valida que la categoría exista y esté activa antes de reasignarla.
    if (categoryId) {
      const cat = await prisma.category.findFirst({ where: { id: categoryId, isActive: true }, select: { id: true } })
      if (!cat) return NextResponse.json({ error: "Categoría inválida" }, { status: 400 })
    }
    // La subcategoría solo se valida cuando CAMBIA de verdad (subcategoría o categoría
    // distintas a las guardadas). Si el formulario reenvía la MISMA subcategoría que
    // ya tiene el negocio (p. ej. al guardar solo imágenes), se acepta sin revalidar:
    // así un cambio de catálogo (dedupe/desactivación de un giro) no bloquea guardar
    // portada, galería u otros campos. Solo un cambio real exige que sea válida.
    const effectiveCategoryId = categoryId ?? business.categoryId
    const subcatChanged = subcategoryId !== undefined && subcategoryId !== business.subcategoryId
    const catChanged = categoryId !== undefined && categoryId !== business.categoryId
    if (subcategoryId && (subcatChanged || catChanged)) {
      const sub = await prisma.subcategory.findFirst({
        where: { id: subcategoryId, isActive: true, categoryId: effectiveCategoryId ?? undefined },
        select: { id: true },
      })
      if (!sub) return NextResponse.json({ error: "Subcategoría inválida" }, { status: 400 })
    }

    await prisma.profile.update({
      where: { id: business.id },
      data: {
        ...rest,
        ...(categoryId ? { categoryId } : {}),
        ...(subcategoryId !== undefined ? { subcategoryId } : {}),
        // Reemplaza todos los horarios (borra los anteriores y crea los nuevos).
        // Al tocar categoryId/subcategoryId el trigger de Postgres recalcula el
        // search_vector solo, no hay que reindexar a mano.
        ...(hours
          ? {
              hours: {
                deleteMany: {},
                createMany: {
                  data: hours.map((h) => ({
                    dayOfWeek: h.dayOfWeek,
                    opensAt: h.isClosed ? null : h.opensAt ?? null,
                    closesAt: h.isClosed ? null : h.closesAt ?? null,
                    isClosed: !!h.isClosed,
                  })),
                },
              },
            }
          : {}),
        // Galería: se reemplaza completa (borra las anteriores, crea las nuevas
        // en el orden recibido). logoUrl/coverImageUrl viajan como escalares en rest.
        ...(images
          ? {
              images: {
                deleteMany: {},
                createMany: {
                  data: images.map((url, i) => ({ imageUrl: url, sortOrder: i })),
                },
              },
            }
          : {}),
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BUSINESS_UPDATE]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al actualizar el negocio" }, { status: 500 })
  }
}

// El dueño elimina su propio negocio (soft-delete: marca deletedAt; las queries
// públicas ya filtran deletedAt. Después puede registrar uno nuevo).
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const business = await prisma.profile.findFirst({
      where: { ownerId: session.user.id, deletedAt: null },
      select: { id: true },
    })
    if (!business) {
      return NextResponse.json({ error: "No tienes un negocio registrado" }, { status: 404 })
    }

    // Soft-delete: marca deletedAt Y saca de ACTIVE, para que ninguna vista
    // pública (búsqueda, "similares", que filtran status='ACTIVE') lo muestre.
    await prisma.profile.update({
      where: { id: business.id },
      data: { deletedAt: new Date(), status: "INACTIVE" },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BUSINESS_DELETE]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar el negocio" }, { status: 500 })
  }
}
