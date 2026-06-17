import { Metadata } from "next"
import { LegalPageShell } from "@/components/legal/legal-page-shell"

export const metadata: Metadata = {
  title: "Política de Privacidad | Guía ZMG",
  description: "Política de privacidad y tratamiento de datos personales de Guía ZMG.",
}

export default function PrivacidadPage() {
  return (
    <LegalPageShell title="Política de Privacidad">
      <p>Tratamos los datos personales conforme a la legislación mexicana aplicable.</p>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Datos recopilados</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 pl-4">
          <li>Nombre</li>
          <li>Correo electrónico</li>
          <li>Teléfono</li>
          <li>Ubicación aproximada</li>
          <li>Actividad dentro de la plataforma</li>
        </ul>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Derechos ARCO</h2>
        <p>
          El usuario puede acceder, rectificar, cancelar u oponerse al tratamiento de sus datos, así
          como solicitar su exportación o eliminación.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Seguridad</h2>
        <p>Usamos HTTPS, contraseñas cifradas y controles de acceso para proteger la información.</p>
      </div>
    </LegalPageShell>
  )
}
