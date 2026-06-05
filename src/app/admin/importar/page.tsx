export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CsvImportForm } from "./csv-import-form"

export default async function AdminImportPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Importar Negocios (CSV)</h1>
        <p className="text-gray-500">Sube un archivo CSV con datos de negocios para carga masiva.</p>
      </div>
      <CsvImportForm />
    </div>
  )
}
