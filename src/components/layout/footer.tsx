import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-bold mb-4">
              <span className="text-blue-600">Guía</span> ZMG
            </h3>
            <p className="text-sm text-gray-600">
              El buscador hiperlocal de la Zona Metropolitana de Guadalajara.
              Encuentra negocios, servicios y profesionales en segundos.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-900">
              Municipios
            </h4>
            <ul className="space-y-2">
              {["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Tlajomulco"].map((m) => (
                <li key={m}>
                  <Link
                    href={`/search?municipio=${m.toLowerCase()}`}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {m}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-900">
              Para Negocios
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/auth/register" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Registrar mi negocio
                </Link>
              </li>
              <li>
                <Link href="/planes" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Planes y precios
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Iniciar sesión
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-900">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/aviso-legal" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Aviso legal
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Términos de uso
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Guía ZMG. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
