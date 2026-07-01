import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

// Skeleton que calca el layout de la página de categoría (mejor percepción que un spinner).
export default function CategoryLoading() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-40 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-5">
                <div className="h-5 w-1/3 animate-pulse rounded bg-gray-200" />
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="mt-4 flex gap-2">
                  <div className="h-8 w-28 animate-pulse rounded-lg bg-gray-100" />
                  <div className="h-8 w-28 animate-pulse rounded-lg bg-gray-100" />
                  <div className="h-8 w-28 animate-pulse rounded-lg bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
