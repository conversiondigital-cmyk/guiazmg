// Placeholder de carga del área de contenido del dashboard. NO dibuja header ni
// fondo propios: el layout ya provee sidebar + header, así que al navegar solo se
// ve un esqueleto ligero del contenido (se siente más rápido, sin el bloque gris).
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-gray-200/60" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="mb-3 h-3.5 w-24 animate-pulse rounded bg-gray-200/60" />
            <div className="h-6 w-16 animate-pulse rounded bg-gray-200/60" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <div className="mb-4 h-5 w-36 animate-pulse rounded bg-gray-200/60" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
