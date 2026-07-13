import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos y Condiciones | Guía ZMG",
  description: "Términos y condiciones de uso de Guía ZMG.",
}

export default function TerminosCondicionesPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-green-900 py-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{backgroundImage:"radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",backgroundSize:"60px 60px"}} />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">Legal</p>
            <h1 className="text-4xl font-black text-white">Términos y Condiciones</h1>
            <p className="mt-2 text-green-300 text-sm">Última actualización: 1 de junio de 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">1. Aceptación de Términos</h2>
              <p>
                Al acceder y utilizar Guía ZMG (en adelante, "la Plataforma"), usted acepta estar obligado por estos
                Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, le recomendamos que
                no utilice la Plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">2. Descripción de Servicios</h2>
              <p>
                Guía ZMG es un directorio en línea de negocios ubicados en Guadalajara y la Zona Metropolitana. Los
                servicios incluyen:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 pl-4">
                <li>Búsqueda y navegación de negocios</li>
                <li>Registro de perfiles de negocio</li>
                <li>Publicación de reseñas y calificaciones</li>
                <li>Gestión de información empresarial</li>
                <li>Herramientas de marketing y promoción</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">3. Registro de Cuenta</h2>
              <p>Para utilizar ciertas características de la Plataforma, deberá crear una cuenta. Usted acepta:</p>
              <ul className="mt-3 list-inside list-disc space-y-2 pl-4">
                <li>Proporcionar información precisa, actual y completa</li>
                <li>Mantener la confidencialidad de su contraseña</li>
                <li>Ser responsable de todas las actividades bajo su cuenta</li>
                <li>Notificarnos inmediatamente de cualquier uso no autorizado</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">4. Conducta del Usuario</h2>
              <p>Usted se compromete a no:</p>
              <ul className="mt-3 list-inside list-disc space-y-2 pl-4">
                <li>Usar la Plataforma para actividades ilegales o fraudulentas</li>
                <li>Publicar contenido ofensivo, discriminatorio o difamatorio</li>
                <li>Intentar acceder sin autorización a sistemas o información</li>
                <li>Distribuir malware o código malicioso</li>
                <li>Interferir con el funcionamiento de la Plataforma</li>
                <li>Violar los derechos de propiedad intelectual</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">5. Contenido Generado por Usuarios</h2>
              <p>
                Al publicar contenido en la Plataforma (reseñas, comentarios, fotos), usted otorga a Guía ZMG una
                licencia no exclusiva, mundial y libre de regalías para usar, reproducir y distribuir dicho contenido.
              </p>
              <p className="mt-3">
                Usted es responsable de todo contenido que publique y garantiza que:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 pl-4">
                <li>Posee todos los derechos necesarios sobre el contenido</li>
                <li>El contenido no infringe derechos de terceros</li>
                <li>El contenido es veraz y no difamatorio</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">6. Reseñas y Calificaciones</h2>
              <p>
                Las reseñas deben ser honestas y basadas en experiencias reales. Nos reservamos el derecho de:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 pl-4">
                <li>Moderar y eliminar reseñas que violen nuestras políticas</li>
                <li>Reportar actividad fraudulenta a las autoridades</li>
                <li>Suspender cuentas de usuarios que publiquen información falsa</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">7. Propiedad Intelectual</h2>
              <p>
                Todo contenido en la Plataforma (incluyendo diseño, gráficos, logos, texto) es propiedad de Guía ZMG
                o de sus licenciadores, y está protegido por derechos de autor y leyes de propiedad intelectual.
              </p>
              <p className="mt-3">
                No se le otorga ningún derecho de propiedad sobre este contenido. Está permitido el acceso y uso
                personal no comercial.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">8. Limitación de Responsabilidad</h2>
              <p>
                La Plataforma se proporciona "tal como está" sin garantías. Guía ZMG no es responsable por:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 pl-4">
                <li>Daños indirectos, incidentales o consecuentes</li>
                <li>Pérdida de datos o ganancias</li>
                <li>Acciones de terceros o usuarios</li>
                <li>Disponibilidad continua de la Plataforma</li>
              </ul>
              <p className="mt-3">
                En ningún caso la responsabilidad total de Guía ZMG excederá el monto pagado por usted en los últimos
                12 meses.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">9. Precios y Pagos</h2>
              <p>
                Guía ZMG ofrece servicios gratuitos y de pago. Para servicios pagos, usted acepta:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 pl-4">
                <li>Pagar los precios mostrados al momento de la compra</li>
                <li>Que los precios pueden cambiar con notificación previa</li>
                <li>Proporcionar información de pago válida y autorizar los cargos</li>
                <li>Que se apliquen las leyes fiscales locales</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">10. Cancelación y Reembolsos</h2>
              <p>
                Puede cancelar su suscripción en cualquier momento desde su panel de control. Los reembolsos se
                procesarán de acuerdo a la política de cancelación específica del plan contratado.
              </p>
              <p className="mt-3">
                No se otorgarán reembolsos por períodos parciales de suscripción activa.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">11. Suspensión y Terminación</h2>
              <p>
                Nos reservamos el derecho de suspender o terminar su acceso a la Plataforma si:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 pl-4">
                <li>Viola estos Términos y Condiciones</li>
                <li>Realiza actividades fraudulentas o ilegales</li>
                <li>Incumple nuestras políticas</li>
              </ul>
              <p className="mt-3">
                La terminación será sin perjuicio de cualquier otra acción legal que podamos tomar.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">12. Enlaces a Terceros</h2>
              <p>
                La Plataforma puede contener enlaces a sitios web de terceros. No nos responsabilizamos por el
                contenido, precisión o seguridad de estos sitios. Su uso de sitios de terceros está sujeto a sus
                propios términos y condiciones.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">13. Cambios a los Términos</h2>
              <p>
                Nos reservamos el derecho de modificar estos Términos en cualquier momento. El uso continuado de la
                Plataforma después de cambios constituye su aceptación de los nuevos términos.
              </p>
              <p className="mt-3">
                Notificaremos cambios materiales por correo electrónico o mediante un aviso prominente en la
                Plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">14. Ley Aplicable</h2>
              <p>
                Estos Términos y Condiciones se rigen por las leyes del Estado de Jalisco, México, sin considerar
                conflictos de disposiciones legales.
              </p>
              <p className="mt-3">
                Cualquier disputa se resolverá ante los tribunales competentes en Guadalajara, Jalisco.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">15. Contacto</h2>
              <p>
                Si tiene preguntas sobre estos Términos y Condiciones, contáctenos en:
              </p>
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <strong>Email:</strong> contacto@guiazmg.com
                </p>
                <p>
                  <strong>Teléfono:</strong> (33) 4884-3477
                </p>
                <p>
                  <strong>Dirección:</strong> Guadalajara, Jalisco, México
                </p>
              </div>
            </div>

            <div className="border-t-2 pt-6">
              <p className="text-xs text-gray-500">
                Estos Términos y Condiciones fueron últimos actualizados el 1 de junio de 2026 y son efectivos a partir
                de esa fecha.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
