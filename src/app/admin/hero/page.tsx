export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getHeroImages } from "@/lib/hero-images"
import { getHeroConfig } from "@/lib/hero-config"
import { HeroImagesManager } from "@/components/admin/hero-images-manager"
import { HeroConfigForm } from "@/components/admin/hero-config-form"

export default async function AdminHeroPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const [images, config] = await Promise.all([getHeroImages(), getHeroConfig()])

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hero del inicio</h1>
        <p className="text-sm text-muted-foreground">
          Administra el contenido y las imágenes del bloque principal (hero) de la página de inicio.
        </p>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Contenido</h2>
          <p className="text-sm text-muted-foreground">
            Título, subtítulo, búsquedas populares y velocidad del carrusel.
          </p>
        </div>
        <HeroConfigForm initialConfig={config} />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Imágenes del carrusel</h2>
          <p className="text-sm text-muted-foreground">
            Imágenes de fondo del hero. Se muestran en carrusel detrás de un degradado verde
            semitransparente para que el texto siga legible.
          </p>
        </div>
        <HeroImagesManager initialImages={images} />
      </section>
    </div>
  )
}
