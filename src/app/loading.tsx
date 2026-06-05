import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function RootLoading() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </main>
      <Footer />
    </>
  )
}
