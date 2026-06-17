import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

/**
 * Estructura compartida de las páginas legales (Header + hero verde + prose +
 * Footer), idéntica a la de /normas-comunidad. Úsala para que todas las
 * páginas legales tengan la misma estructura y diseño del sitio.
 */
export function LegalPageShell({
  title,
  eyebrow = "Legal",
  updated = "1 de junio de 2026",
  children,
}: {
  title: string
  eyebrow?: string
  updated?: string
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-green-900 py-16">
          <div
            className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }}
          />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">{eyebrow}</p>
            <h1 className="text-4xl font-black text-white">{title}</h1>
            {updated && <p className="mt-2 text-sm text-green-300">Última actualización: {updated}</p>}
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none space-y-6 text-gray-700">{children}</div>
        </section>
      </main>
      <Footer />
    </>
  )
}
