import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BusinessRegistrationWizard } from "@/components/business/business-registration-wizard"
import { getGoogleMapsApiKey } from "@/lib/maps-config"
import { getActivePromoCoupons } from "@/lib/coupons/promo-coupons"

export const dynamic = "force-dynamic"

export default async function RegistrarNegocioPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  const [mapsApiKey, promoCoupons] = await Promise.all([
    getGoogleMapsApiKey(),
    getActivePromoCoupons(),
  ])
  const { tipo } = await searchParams
  // El tipo real lo decide la pantalla de 3 preguntas dentro del wizard; el ?tipo
  // solo sesga el valor inicial (compatibilidad con enlaces existentes).
  const profileType = tipo === "emprendedor" ? "EMPRENDEDOR" : "NEGOCIO"

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Registra tu negocio o emprendimiento
            </h1>
            <p className="mt-2 text-gray-600">
              Responde unas preguntas rápidas y te registramos en el perfil que mejor te queda para
              aparecer en las búsquedas de Guía ZMG.
            </p>
          </div>
          <BusinessRegistrationWizard
            mapsApiKey={mapsApiKey}
            profileType={profileType}
            promoCoupons={promoCoupons}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
