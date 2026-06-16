import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ReportForm } from "@/components/report-form"

export const dynamic = "force-dynamic"

export default async function ReportarPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; id?: string }>
}) {
  const session = await auth()
  const { type, id } = await searchParams

  if (!session?.user?.id) {
    const qs = type ? `?type=${type}&id=${id ?? ""}` : ""
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/reportar${qs}`)}`)
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50 py-10">
        <div className="mx-auto max-w-lg px-4">
          <h1 className="text-2xl font-bold text-gray-900">Reportar contenido</h1>
          <p className="mt-1 text-sm text-gray-500">
            Cuéntanos qué viste mal. Nuestro equipo lo revisará lo antes posible.
          </p>
          <div className="mt-6">
            <ReportForm type={type} id={id} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
