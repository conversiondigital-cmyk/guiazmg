import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BusinessRegistrationWizard } from "@/components/business/business-registration-wizard"
import { getGoogleMapsApiKey } from "@/lib/maps-config"

export const dynamic = "force-dynamic"

export default async function RegistrarNegocioPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  const mapsApiKey = await getGoogleMapsApiKey()
  const { tipo } = await searchParams
  const isEmprendedor = tipo === "emprendedor"
  const profileType = isEmprendedor ? "EMPRENDEDOR" : "NEGOCIO"

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {isEmprendedor ? "Crea tu perfil de Emprendedor" : "Registra tu negocio"}
            </h1>
            <p className="mt-2 text-gray-600">
              {isEmprendedor
                ? "Vende tus productos o servicios en tu zona: por pedido, catálogo o WhatsApp. No necesitas local."
                : "Aparece en las búsquedas de Guía ZMG y haz crecer tu negocio."}
            </p>
          </div>
          <BusinessRegistrationWizard mapsApiKey={mapsApiKey} profileType={profileType} />
        </div>
      </main>
      <Footer />
    </>
  )
}
