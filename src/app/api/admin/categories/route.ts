import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      include: {
        subcategories: {
          include: {
            _count: { select: { businesses: true, listings: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { subcategories: true, businesses: true, listings: true } },
      },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_GET]", error)
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description, icon, sortOrder, isActive, isSubcategory, categoryId, keywords } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Nombre y slug requeridos" }, { status: 400 })
    }

    // Crear subcategoría (el árbol de categorías comparte este endpoint vía el
    // botón "+" de cada categoría, que envía isSubcategory + categoryId).
    if (isSubcategory && categoryId) {
      const existingSub = await prisma.subcategory.findUnique({
        where: { categoryId_slug: { categoryId, slug } },
      })
      if (existingSub) {
        return NextResponse.json({ error: "El slug ya existe en esta categoría" }, { status: 409 })
      }
      const subcategory = await prisma.subcategory.create({
        data: {
          categoryId,
          name,
          slug,
          description: description || null,
          sortOrder: sortOrder ?? 0,
          isActive: isActive ?? true,
        },
      })
      await prisma.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "CREATE_SUBCATEGORY",
          entityType: "Subcategory",
          entityId: subcategory.id,
          newValue: JSON.stringify({ name, slug, categoryId }),
        },
      })
      return NextResponse.json({ subcategory }, { status: 201 })
    }

    const existing = await prisma.category.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 409 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon,
        keywords: keywords || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
      include: {
        subcategories: {
          include: {
            _count: { select: { businesses: true, listings: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { subcategories: true, businesses: true, listings: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "CREATE_CATEGORY",
        entityType: "Category",
        entityId: category.id,
        newValue: JSON.stringify({ name, slug }),
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_POST]", error)
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, slug, description, icon, sortOrder, isActive, keywords } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const data: any = {}
    if (name !== undefined) data.name = name
    if (slug !== undefined) data.slug = slug
    if (description !== undefined) data.description = description
    if (icon !== undefined) data.icon = icon
    if (sortOrder !== undefined) data.sortOrder = sortOrder
    if (isActive !== undefined) data.isActive = isActive
    if (keywords !== undefined) data.keywords = keywords || null

    const category = await prisma.category.update({
      where: { id },
      data,
      include: {
        subcategories: {
          include: {
            _count: { select: { businesses: true, listings: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { subcategories: true, businesses: true, listings: true } },
      },
    })

    // Si cambió keywords o nombre, re-dispara el trigger de search_vector en los
    // negocios de esta categoría (poner categoryId = categoryId basta: categoryId
    // está en la lista UPDATE OF del trigger). Así los sinónimos nuevos aplican.
    if (keywords !== undefined || name !== undefined) {
      await prisma.$executeRawUnsafe(`UPDATE businesses SET "categoryId" = "categoryId" WHERE "categoryId" = $1`, id)
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "UPDATE_CATEGORY",
        entityType: "Category",
        entityId: id,
        newValue: JSON.stringify(body),
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_PUT]", error)
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { action, ids, id } = body

    if (action === "reorder" && ids) {
      for (let i = 0; i < ids.length; i++) {
        await prisma.category.update({
          where: { id: ids[i] },
          data: { sortOrder: i },
        })
      }
      return NextResponse.json({ success: true })
    }

    if (action === "toggleActive" && id) {
      const category = await prisma.category.findUnique({ where: { id }, select: { isActive: true } })
      if (!category) {
        return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 })
      }
      await prisma.category.update({
        where: { id },
        data: { isActive: !category.isActive },
      })
      return NextResponse.json({ success: true, isActive: !category.isActive })
    }

    if (action === "delete" && id) {
      await prisma.category.delete({ where: { id } })
      await prisma.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "DELETE_CATEGORY",
          entityType: "Category",
          entityId: id,
        },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_PATCH]", error)
    return NextResponse.json({ error: "Error en operación" }, { status: 500 })
  }
}
