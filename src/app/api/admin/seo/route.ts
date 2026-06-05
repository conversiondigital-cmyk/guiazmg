import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeSeoContent } from "@/lib/seo/content"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const landingPages = await prisma.seoLandingPage.findMany({
      orderBy: { createdAt: "desc" },
    })

    const seoSettings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ["seo_default_title", "seo_default_description", "seo_default_keywords", "sitemap_url", "robots_txt"] },
      },
    })

    return NextResponse.json({ landingPages, seoSettings })
  } catch (error) {
    console.error("[ADMIN_SEO_GET]", error)
    return NextResponse.json({ error: "Error al obtener datos SEO" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    if (body.action === "generate") {
      const municipalities = await prisma.municipality.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
      })
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
      })

      let created = 0
      for (const m of municipalities) {
        for (const c of categories) {
          const slug = `${m.slug}/${c.slug}`
          const exists = await prisma.seoLandingPage.findUnique({ where: { slug } })
          if (exists) continue

          await prisma.seoLandingPage.create({
            data: {
              slug,
              title: `${c.name} en ${m.name} | Guía ZMG`,
              metaDescription: `Encuentra los mejores ${c.name.toLowerCase()} en ${m.name}, Jalisco. Consulta direcciones, teléfonos, horarios y opiniones.`,
              content: sanitizeSeoContent(
                `${c.name} en ${m.name}\nEncuentra los mejores ${c.name.toLowerCase()} en ${m.name}. Explora nuestro directorio completo con información detallada.`
              ),
              isActive: true,
            },
          })
          created++
        }
      }

      return NextResponse.json({ success: true, created })
    }

    if (body.action === "generate-all") {
      const municipalities = await prisma.municipality.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
      })
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
      })
      const neighborhoods = await prisma.neighborhood.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, municipalityId: true, municipality: { select: { slug: true, name: true } } },
      })

      let created = 0

      for (const m of municipalities) {
        for (const c of categories) {
          const slug = `${m.slug}/${c.slug}`
          const exists = await prisma.seoLandingPage.findUnique({ where: { slug } })
          if (exists) continue

          await prisma.seoLandingPage.create({
            data: {
              slug,
              title: `${c.name} en ${m.name} | Guía ZMG`,
              metaDescription: `Encuentra los mejores ${c.name.toLowerCase()} en ${m.name}, Jalisco. Consulta direcciones, teléfonos, horarios y opiniones.`,
              content: sanitizeSeoContent(
                `${c.name} en ${m.name}\nEncuentra los mejores ${c.name.toLowerCase()} en ${m.name}. Explora nuestro directorio completo con información detallada.`
              ),
              isActive: true,
            },
          })
          created++
        }
      }

      for (const n of neighborhoods) {
        for (const c of categories) {
          const slug = `${n.municipality.slug}/${c.slug}/${n.slug}`
          const exists = await prisma.seoLandingPage.findUnique({ where: { slug } })
          if (exists) continue

          await prisma.seoLandingPage.create({
            data: {
              slug,
              title: `${c.name} en ${n.name}, ${n.municipality.name} | Guía ZMG`,
              metaDescription: `Encuentra ${c.name.toLowerCase()} en ${n.name}, ${n.municipality.name}. Teléfonos, WhatsApp, horarios y reseñas.`,
              content: sanitizeSeoContent(
                `${c.name} en ${n.name}, ${n.municipality.name}\nEncuentra ${c.name.toLowerCase()} en la colonia ${n.name}, ${n.municipality.name}.`
              ),
              isActive: true,
            },
          })
          created++
        }
      }

      return NextResponse.json({ success: true, created })
    }

    const { slug, title, metaDescription, content, isActive } = body
    if (!slug || !title) {
      return NextResponse.json({ error: "Slug y título requeridos" }, { status: 400 })
    }

    const existing = await prisma.seoLandingPage.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 409 })
    }

    const page = await prisma.seoLandingPage.create({
      data: {
        slug,
        title,
        metaDescription,
        content: typeof content === "string" ? sanitizeSeoContent(content) : content,
        isActive: isActive ?? true,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "CREATE_LANDING_PAGE",
        entityType: "SeoLandingPage",
        entityId: page.id,
        newValue: JSON.stringify({ slug, title }),
      },
    })

    return NextResponse.json({ page }, { status: 201 })
  } catch (error) {
    console.error("[ADMIN_SEO_POST]", error)
    return NextResponse.json({ error: "Error al crear landing page" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, slug, title, metaDescription, content, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (slug !== undefined) data.slug = slug
    if (title !== undefined) data.title = title
    if (metaDescription !== undefined) data.metaDescription = metaDescription
    if (content !== undefined) data.content = typeof content === "string" ? sanitizeSeoContent(content) : content
    if (isActive !== undefined) data.isActive = isActive

    const page = await prisma.seoLandingPage.update({ where: { id }, data })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "UPDATE_LANDING_PAGE",
        entityType: "SeoLandingPage",
        entityId: id,
        newValue: JSON.stringify(body),
      },
    })

    return NextResponse.json({ page })
  } catch (error) {
    console.error("[ADMIN_SEO_PUT]", error)
    return NextResponse.json({ error: "Error al actualizar landing page" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { action, id } = body

    if (action === "toggleActive" && id) {
      const page = await prisma.seoLandingPage.findUnique({ where: { id }, select: { isActive: true } })
      if (!page) {
        return NextResponse.json({ error: "Landing page no encontrada" }, { status: 404 })
      }
      await prisma.seoLandingPage.update({
        where: { id },
        data: { isActive: !page.isActive },
      })
      return NextResponse.json({ success: true, isActive: !page.isActive })
    }

    if (action === "delete" && id) {
      await prisma.seoLandingPage.delete({ where: { id } })
      await prisma.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "DELETE_LANDING_PAGE",
          entityType: "SeoLandingPage",
          entityId: id,
        },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error("[ADMIN_SEO_PATCH]", error)
    return NextResponse.json({ error: "Error en operación" }, { status: 500 })
  }
}
