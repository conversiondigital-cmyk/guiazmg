import { Metadata } from "next"
import { LegalPageShell } from "@/components/legal/legal-page-shell"

export const metadata: Metadata = {
  title: "Términos y Condiciones | Guía ZMG",
  description: "Términos de uso de Guía ZMG.",
}

export default function TerminosPage() {
  return (
    <LegalPageShell title="Términos y Condiciones">
      <p>
        Guía ZMG es una plataforma tecnológica que conecta usuarios, negocios, compradores y
        vendedores.
      </p>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Responsabilidad del contenido</h2>
        <p>Cada usuario es responsable de sus publicaciones, reseñas, productos, servicios y comentarios.</p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sin garantía</h2>
        <p>No garantizamos la calidad, identidad o veracidad absoluta de los contenidos publicados por terceros.</p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Uso permitido</h2>
        <p>Está prohibido publicar contenido ilegal, fraudulento, ofensivo, violento o engañoso.</p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Suspensión y moderación</h2>
        <p>
          Podemos ocultar, suspender o eliminar contenido o cuentas cuando exista riesgo legal,
          operativo o reputacional.
        </p>
      </div>
    </LegalPageShell>
  )
}
