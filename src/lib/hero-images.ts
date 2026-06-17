import { prisma } from "@/lib/prisma"

// Las imágenes del carrusel del hero se guardan como una lista ordenada de
// rutas en el key-value de settings (systemSetting["hero_images"]). Los
// ARCHIVOS viven en public/uploads/hero/ (no en la BD); aquí solo van las rutas.
const KEY = "hero_images"

export async function getHeroImages(): Promise<string[]> {
  try {
    const s = await prisma.systemSetting.findUnique({ where: { key: KEY } })
    if (!s?.value) return []
    const arr = JSON.parse(s.value)
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []
  } catch {
    return []
  }
}

export async function setHeroImages(images: string[]): Promise<void> {
  const value = JSON.stringify(images)
  await prisma.systemSetting.upsert({
    where: { key: KEY },
    update: { value, isSecret: false },
    create: { key: KEY, value, isSecret: false, description: "Imágenes del carrusel del hero (inicio)" },
  })
}
