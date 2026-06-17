import { Metadata } from "next"
import { LegalPageShell } from "@/components/legal/legal-page-shell"

export const metadata: Metadata = {
  title: "Política de Cookies | Guía ZMG",
  description: "Información sobre el uso de cookies en Guía ZMG.",
}

export default function CookiesPolicyPage() {
  return (
    <LegalPageShell title="Política de Cookies">
      <p>
        Usamos cookies y tecnologías similares para gestionar la sesión, la seguridad, tus
        preferencias y la analítica de uso de la plataforma.
      </p>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tipos de cookies</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 pl-4">
          <li><strong>Esenciales:</strong> sesión y seguridad (necesarias para que el sitio funcione).</li>
          <li><strong>Preferencias:</strong> idioma y configuración personalizada.</li>
          <li><strong>Analítica:</strong> entender cómo se usa la plataforma para mejorarla.</li>
        </ul>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Control de cookies</h2>
        <p>
          Puedes gestionar o eliminar las cookies desde la configuración de tu navegador. Ten en
          cuenta que desactivar las cookies esenciales puede afectar el funcionamiento del sitio.
        </p>
      </div>
    </LegalPageShell>
  )
}
