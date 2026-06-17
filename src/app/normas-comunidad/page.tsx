import { Metadata } from "next"
import { LegalPageShell } from "@/components/legal/legal-page-shell"

export const metadata: Metadata = {
  title: "Normas de Comunidad | Guía ZMG",
  description: "Normas de comunidad para publicar en Guía ZMG.",
}

export default function CommunityRulesPage() {
  return (
    <LegalPageShell title="Normas de Comunidad">
      <p>
        Estas reglas aplican a reseñas, anuncios, marketplace, solicitudes y cualquier contenido
        generado por usuarios.
      </p>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Contenido prohibido</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 pl-4">
          <li>Spam, fraude o suplantación de identidad</li>
          <li>Contenido ilegal o robado</li>
          <li>Violencia, amenazas o discriminación</li>
          <li>Malware o intentos de hackeo</li>
        </ul>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reseñas</h2>
        <p>Las reseñas deben reflejar experiencias reales y honestas.</p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Moderación</h2>
        <p>
          Podemos ocultar o eliminar contenido y suspender usuarios cuando exista incumplimiento de
          estas normas.
        </p>
      </div>
    </LegalPageShell>
  )
}
