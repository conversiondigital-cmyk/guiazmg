// Indicador "X de Y" del uso del catálogo (productos o servicios) frente al tope
// del plan, con barra de progreso. Se pone en rojo al alcanzar el límite.
export function CatalogCounter({
  used,
  limit,
  noun,
}: {
  used: number
  limit: number
  noun: string // "productos" | "servicios"
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const atLimit = limit > 0 && used >= limit

  return (
    <div className="min-w-[180px]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-gray-500">Usados</span>
        <span className={`text-sm font-semibold ${atLimit ? "text-red-600" : "text-gray-900"}`}>
          {used} <span className="font-normal text-gray-400">de {limit}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full transition-all ${atLimit ? "bg-red-500" : "bg-green-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {atLimit && (
        <p className="mt-1 text-xs text-red-600">
          Alcanzaste el límite de {noun} de tu plan.
        </p>
      )}
    </div>
  )
}
