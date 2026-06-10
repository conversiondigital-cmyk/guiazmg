import { Construction } from "lucide-react"

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
        <Construction className="h-7 w-7 text-amber-600" />
      </div>
      <h1 className="text-xl font-black text-gray-900">{title}</h1>
      <p className="mt-1 text-sm text-gray-500">Esta sección estará disponible próximamente.</p>
    </div>
  )
}
