import { serviceModeLabel } from "@/lib/profile-modality"
import { Sparkles, Building2, MapPin, PackageCheck } from "lucide-react"

// Bloque que diferencia visualmente al Emprendedor del Negocio en su perfil
// público: badge del tipo, modalidades de atención (por pedido, a domicilio…),
// "sin local físico" y zona de cobertura. Presentacional (server component).
export function BusinessModality({
  profileType,
  serviceModes,
  coverageArea,
  hasPhysicalLocation,
  isFounder = false,
  isBoosted = false,
}: {
  profileType: string
  serviceModes: string[]
  coverageArea: string | null
  hasPhysicalLocation: boolean | null
  isFounder?: boolean
  isBoosted?: boolean
}) {
  const isEmprendedor = profileType === "EMPRENDEDOR"
  const modes = serviceModes ?? []
  const noLocal = hasPhysicalLocation === false
  const hasExtra = modes.length > 0 || !!coverageArea || noLocal || isFounder || isBoosted

  // Para un Negocio con local y sin distintivos no hay nada útil que agregar aquí.
  if (!isEmprendedor && !hasExtra) return null

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isEmprendedor ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"
          }`}
        >
          {isEmprendedor ? <Sparkles className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
          {isEmprendedor ? "Emprendedor" : "Negocio"}
        </span>
        {isBoosted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
            Destacado
          </span>
        )}
        {isFounder && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
            ⭐ Fundador
          </span>
        )}
        {noLocal && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <PackageCheck className="h-3.5 w-3.5" /> Sin local físico
          </span>
        )}
      </div>

      {modes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {modes.map((code) => (
            <span key={code} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
              {serviceModeLabel(code)}
            </span>
          ))}
        </div>
      )}

      {coverageArea && (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-gray-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <span>
            <span className="font-medium text-gray-700">Zona: </span>
            {coverageArea}
          </span>
        </p>
      )}
    </section>
  )
}
