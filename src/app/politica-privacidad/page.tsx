import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidad | Guía ZMG",
  description: "Política de privacidad de Guía ZMG. Conoce cómo protegemos tus datos personales.",
}

export default function PoliticaPrivacidadPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-green-900 py-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{backgroundImage:"radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",backgroundSize:"60px 60px"}} />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">Legal · LFPDPPP</p>
            <h1 className="text-4xl font-black text-white">Política de Privacidad</h1>
            <p className="mt-2 text-green-300 text-sm">Última actualización: 1 de junio de 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                <strong>Importante:</strong> Esta Política de Privacidad complementa el Aviso de Privacidad y explica
                en detalle cómo Guía ZMG recopila, usa y protege tus datos personales de conformidad con la Ley Federal
                de Protección de Datos Personales en Posesión de Particulares (LFPDPPP).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">1. Responsable del Tratamiento de Datos</h2>
              <p>
                <strong>Guía ZMG S.A. de C.V.</strong> (en adelante, "Responsable") es la entidad responsable del
                tratamiento de tus datos personales.
              </p>
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <strong>Domicilio:</strong> Guadalajara, Jalisco, México
                </p>
                <p>
                  <strong>Email:</strong> contacto@guiazmg.com
                </p>
                <p>
                  <strong>Teléfono:</strong> (33) 4884-3477
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">2. Datos Personales Recopilados</h2>
              <p>Recopilamos los siguientes tipos de datos personales:</p>

              <h3 className="mt-4 font-semibold text-gray-900">2.1 Datos de Identificación</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
                <li>Nombre completo</li>
                <li>Correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Domicilio</li>
                <li>RFC (para usuarios comerciales)</li>
              </ul>

              <h3 className="mt-4 font-semibold text-gray-900">2.2 Datos de Negocio</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
                <li>Nombre del negocio</li>
                <li>Ubicación y horarios</li>
                <li>Descripción de servicios</li>
                <li>Fotografías y videos</li>
                <li>Información de contacto comercial</li>
              </ul>

              <h3 className="mt-4 font-semibold text-gray-900">2.3 Datos de Transacción</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
                <li>Historial de compras</li>
                <li>Información de facturación</li>
                <li>Información de pago (procesada de forma segura)</li>
              </ul>

              <h3 className="mt-4 font-semibold text-gray-900">2.4 Datos de Uso y Navegación</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
                <li>Dirección IP</li>
                <li>Tipo de navegador y dispositivo</li>
                <li>Páginas visitadas y duración de visitas</li>
                <li>Búsquedas realizadas</li>
                <li>Cookies y tecnologías similares</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">3. Finalidades del Tratamiento</h2>
              <p>Utilizamos tus datos para:</p>

              <h3 className="mt-4 font-semibold text-gray-900">3.1 Finalidades Primarias</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
                <li>Crear y administrar tu cuenta</li>
                <li>Prestar los servicios contratados</li>
                <li>Procesar pagos</li>
                <li>Enviar notificaciones sobre tu cuenta</li>
                <li>Responder tus consultas</li>
              </ul>

              <h3 className="mt-4 font-semibold text-gray-900">3.2 Finalidades Secundarias</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
                <li>Mejorar la calidad de nuestros servicios</li>
                <li>Enviar promociones e información sobre nuevos servicios (con tu consentimiento)</li>
                <li>Realizar análisis y estadísticas</li>
                <li>Detectar y prevenir fraude</li>
                <li>Cumplir obligaciones legales</li>
                <li>Personalizar tu experiencia</li>
              </ul>

              <p className="mt-3 text-sm text-gray-600">
                <strong>Nota:</strong> Las finalidades secundarias requieren tu consentimiento explícito. Puedes
                revocar este consentimiento en cualquier momento.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">4. Base Legal del Tratamiento</h2>
              <p>El tratamiento de tus datos se basa en:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
                <li>Tu consentimiento explícito</li>
                <li>Necesidad para cumplir contratos contigo</li>
                <li>Obligaciones legales</li>
                <li>Interés legítimo de Guía ZMG</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">5. Divulgación de Datos</h2>
              <p>
                Compartimos tus datos personales únicamente con terceros en los siguientes casos:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 pl-4">
                <li>
                  <strong>Proveedores de Servicios:</strong> Procesadores de pagos, proveedores de hosting, servicios
                  de email
                </li>
                <li>
                  <strong>Requisitos Legales:</strong> Cuando la ley lo exija o para proteger nuestros derechos
                </li>
                <li>
                  <strong>Transacciones Comerciales:</strong> En caso de fusión, venta o adquisición
                </li>
                <li>
                  <strong>Con tu Consentimiento:</strong> Cuando hayas autorizado específicamente el compartir
                </li>
              </ul>
              <p className="mt-3 text-sm">
                Todos nuestros proveedores están obligados contractualmente a proteger tus datos con los mismos
                estándares de seguridad que Guía ZMG.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">6. Retención de Datos</h2>
              <p>
                Mantenemos tus datos personales mientras sea necesario para:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1 pl-4">
                <li>Cumplir la finalidad por la cual fueron recopilados</li>
                <li>Cumplir obligaciones legales (mínimo 5 años)</li>
                <li>Resolver disputas legales</li>
              </ul>
              <p className="mt-3">
                Después de este período, los datos serán eliminados de forma segura o anonimizados.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">7. Medidas de Seguridad</h2>
              <p>
                Implementamos medidas técnicas, administrativas y físicas para proteger tus datos:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1 pl-4">
                <li>Encriptación SSL/TLS en transmisión de datos</li>
                <li>Contraseñas encriptadas con algoritmos seguros</li>
                <li>Acceso restringido a personal autorizado</li>
                <li>Auditorías de seguridad regulares</li>
                <li>Firewalls y sistemas de detección de intrusiones</li>
                <li>Planes de respuesta ante incidentes de seguridad</li>
              </ul>
              <p className="mt-3 text-sm">
                Sin embargo, ningún sistema de seguridad es 100% garantizado. Te pedimos que mantengas tu contraseña
                confidencial.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">8. Cookies y Tecnologías de Rastreo</h2>
              <p>
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1 pl-4">
                <li>Recordar tus preferencias</li>
                <li>Entender cómo usas la Plataforma</li>
                <li>Mejorar el rendimiento del sitio</li>
                <li>Fines de marketing (con consentimiento)</li>
              </ul>
              <p className="mt-3">
                Puedes controlar las cookies en tu navegador. Sin embargo, desactivarlas puede afectar la funcionalidad
                de la Plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">9. Tus Derechos Bajo la LFPDPPP</h2>
              <p>
                Conforme a la Ley Federal de Protección de Datos Personales, tienes los siguientes derechos (ARCO):
              </p>

              <h3 className="mt-4 font-semibold text-gray-900">9.1 Derecho de Acceso</h3>
              <p className="mt-2">
                Puedes solicitar acceso a todos tus datos personales que mantenemos. Proporcionaremos la información
                de forma clara y comprensible.
              </p>

              <h3 className="mt-4 font-semibold text-gray-900">9.2 Derecho de Rectificación</h3>
              <p className="mt-2">
                Si encuentras datos inexactos o incompletos, puedes solicitar su corrección. Actualizaremos la
                información y notificaremos a terceros a los que haya sido transferida.
              </p>

              <h3 className="mt-4 font-semibold text-gray-900">9.3 Derecho de Cancelación</h3>
              <p className="mt-2">
                Puedes solicitar la eliminación de tus datos cuando:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
                <li>No sean necesarios para la finalidad</li>
                <li>Ya no consientas su tratamiento</li>
                <li>Se hayan tratado ilegalmente</li>
              </ul>

              <h3 className="mt-4 font-semibold text-gray-900">9.4 Derecho de Oposición</h3>
              <p className="mt-2">
                Puedes oponerle a que tus datos sean utilizados para finalidades de marketing o análisis.
              </p>

              <h3 className="mt-4 font-semibold text-gray-900">9.5 Derecho de Portabilidad</h3>
              <p className="mt-2">
                Puedes solicitar tus datos en un formato estructurado y transferirlos a otro responsable.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">10. Cómo Ejercer tus Derechos</h2>
              <p>
                Para ejercer cualquiera de tus derechos ARCO, contacta a nuestro Departamento de Privacidad:
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <p>
                  <strong>Email:</strong> contacto@guiazmg.com
                </p>
                <p>
                  <strong>Teléfono:</strong> (33) 4884-3477
                </p>
                <p>
                  <strong>Formulario en línea:</strong> Panel de control &gt; Configuración &gt; Privacidad
                </p>
              </div>
              <p className="mt-3">
                Responderemos tu solicitud en un plazo máximo de 20 días hábiles. Podemos solicitar información
                adicional para verificar tu identidad.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">11. Privacidad de Menores</h2>
              <p>
                La Plataforma no está dirigida a menores de 18 años. No recopilamos intencionalmente datos de menores.
                Si descubrimos que hemos recopilado datos de un menor sin consentimiento parental, los eliminaremos
                inmediatamente.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">12. Cambios a esta Política</h2>
              <p>
                Nos reservamos el derecho de actualizar esta Política en cualquier momento. Los cambios significativos
                serán comunicados por email o mediante un aviso prominente en la Plataforma.
              </p>
              <p className="mt-3">
                El uso continuado de la Plataforma después de cambios constituye tu aceptación de la nueva Política.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">13. Contacto</h2>
              <p>
                Si tienes preguntas sobre esta Política o el tratamiento de tus datos, contacta:
              </p>
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <strong>Email:</strong> contacto@guiazmg.com
                </p>
                <p>
                  <strong>Teléfono:</strong> (33) 4884-3477
                </p>
              </div>
            </div>

            <div className="border-t-2 pt-6">
              <p className="text-xs text-gray-500">
                Esta Política de Privacidad fue última actualizada el 1 de junio de 2026 y se rige por la Ley Federal
                de Protección de Datos Personales en Posesión de Particulares (LFPDPPP).
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
