import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"

function normalize(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9]/g, "")
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

    const maxSizeBytes = 2 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ error: "CSV demasiado grande. Máximo 2MB" }, { status: 400 })
    }

    if (file.type && !["text/csv", "text/plain", "application/vnd.ms-excel"].includes(file.type)) {
      return NextResponse.json({ error: "Formato inválido. Usa CSV" }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split("\n").filter(Boolean)
    if (lines.length < 2) return NextResponse.json({ error: "CSV must have header + data rows" }, { status: 400 })

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const rows = lines.slice(1).map((l) => {
      const vals = l.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = vals[i] || "" })
      return row
    })

    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let created = 0
    let duplicated = 0
    let skipped = 0
    const errors: string[] = []

    const categories = await prisma.category.findMany()
    const municipalities = await prisma.municipality.findMany()
    const neighborhoods = await prisma.neighborhood.findMany()
    const catMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]))
    const munMap = new Map(municipalities.map((m) => [m.name.toLowerCase(), m.id]))
    const neighMap = new Map(neighborhoods.map((n) => [n.name.toLowerCase(), n]))

    const existingPhones = new Set<string>()
    const existingWebsites = new Set<string>()
    const existingNames = new Set<string>()
    const existingLocations = new Set<string>()
    const existingBizs: any[] = await prisma.profile.findMany({
      where: { deletedAt: null },
      select: { name: true, phone: true, whatsapp: true, websiteUrl: true, municipalityId: true, neighborhoodId: true },
    })
    for (const b of existingBizs) {
      if (b.phone) existingPhones.add(normalize(b.phone))
      if (b.whatsapp) existingPhones.add(normalize(b.whatsapp))
      if (b.websiteUrl) existingWebsites.add(normalize(b.websiteUrl))
      existingNames.add(normalize(b.name))
      existingLocations.add(`${b.municipalityId || ""}:${b.neighborhoodId || ""}:${normalize(b.name)}`)
    }

    const seenInFile = new Set<string>()

    for (const row of rows) {
      try {
        const name = row["name"] || row["nombre"] || row["negocio"]
        if (!name) { skipped++; continue }

        const nameNorm = normalize(name)
        const slugBase = slugify(name)
        const slug = `${slugBase}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

        const categoryId = catMap.get((row["category"] || row["categoria"] || "").toLowerCase())
        const municipalityId = munMap.get((row["municipality"] || row["municipio"] || "").toLowerCase())
        const neighName = (row["neighborhood"] || row["colonia"] || "").toLowerCase()
        const neighborhood: any = neighName ? neighMap.get(neighName) : undefined
        const locationKey = `${municipalityId || neighborhood?.municipalityId || ""}:${neighborhood?.id || ""}:${nameNorm}`

        const phone = row["phone"] || row["telefono"] || ""
        const whatsapp = row["whatsapp"] || ""
        const website = row["website"] || row["web"] || ""
        const phoneNorm = normalize(phone)
        const websiteNorm = normalize(website)

        if (existingNames.has(nameNorm) || seenInFile.has(nameNorm) || existingLocations.has(locationKey)) { duplicated++; continue }
        if (phoneNorm && existingPhones.has(phoneNorm)) { duplicated++; continue }
        if (websiteNorm && existingWebsites.has(websiteNorm)) { duplicated++; continue }

        seenInFile.add(nameNorm)
        if (phoneNorm) existingPhones.add(phoneNorm)
        if (websiteNorm) existingWebsites.add(websiteNorm)
        existingNames.add(nameNorm)
        existingLocations.add(locationKey)

        const addressText = row["address"] || row["direccion"] || ""
        const googleMapsUrl = row["google_maps_url"] || row["google_maps"] || ""

        await prisma.profile.create({
          data: {
            ownerId: session.user.id,
            name,
            slug,
            shortDescription: row["short_description"] || row["descripcion_corta"] || row["description"] || null,
            description: row["description"] || row["descripcion"] || null,
            phone: phone || null,
            whatsapp: whatsapp || null,
            email: row["email"] || null,
            websiteUrl: website || null,
            googleMapsUrl: googleMapsUrl || null,
            addressText: addressText || null,
            latitude: row["latitude"] || row["lat"] ? parseFloat(row["latitude"] || row["lat"]) : null,
            longitude: row["longitude"] || row["lng"] ? parseFloat(row["longitude"] || row["lng"]) : null,
            categoryId,
            municipalityId: municipalityId || neighborhood?.municipalityId || null,
            neighborhoodId: neighborhood?.id || null,
            status: "ACTIVE",
          },
        })
        created++
      } catch (e: any) {
        errors.push(`Row "${row.name || row.nombre || "?"}": ${e.message}`)
      }
    }

    return NextResponse.json({ created, duplicated, skipped, errors: errors.slice(0, 20), totalErrors: errors.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
