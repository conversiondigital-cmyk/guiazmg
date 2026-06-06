import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Metadata } from "next"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Aviso de Privacidad | Guía ZMG",
  description:
    "Aviso de Privacidad conforme a la LFPDPPP. Información sobre el tratamiento de datos personales en Guía ZMG.",
}

export default function AvisoPrivacidadPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-white">Aviso de Privacidad</h1>
            <p className="mt-2 text-gray-300">Última actualización: 1 de junio de 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Legal Notice */}
            <Card className="border-blue-200 bg-blue-50 p-6">
              <p className="text-sm text-blue-900">
                <strong>AVISO LEGAL CONFORME A LA LEY FEDERAL DE PROTECCIÓN DE DATOS PERSONALES EN POSESIÓN DE
                PARTICULARES (LFPDPPP)</strong>
              </p>
              <p className="mt-2 text-xs text-blue-800">
                Este documento es un Aviso de Privacidad simplificado. Para información detallada, consulta nuestra{" "}
                <a href="/politica-privacidad" className="underline hover:text-blue-700">
                  Política de Privacidad Integral
                </a>
                .
              </p>
            </Card>

            {/* 1. Responsable del Tratamiento */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">1. Responsable del Tratamiento de Datos Personales</h2>
              <p className="mt-2 text-gray-700">
                <strong>Guía ZMG S.A. de C.V.</strong> es responsable del tratamiento de tus datos personales.
              </p>
              <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm">
                <p>
                  <strong>Domicilio:</strong> Guadalajara, Jalisco, México
                </p>
                <p className="mt-1">
                  <strong>Correo Electrónico:</strong> privacidad@guiazmg.com
                </p>
                <p className="mt-1">
                  <strong>Teléfono:</strong> (33) 0000-0000
                </p>
              </div>
            </div>

            {/* 2. Datos Personales Recopilados */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">2. Datos Personales que Recopilamos</h2>
              <div className="mt-3 space-y-3 text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900">Datos de Identificación:</h3>
                  <p className="text-sm">Nombre, email, teléfono, domicilio, RFC (si aplica)</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Datos de Negocio:</h3>
                  <p className="text-sm">Nombre del negocio, ubicación, descripción, fotos, horarios</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Datos de Transacción:</h3>
                  <p className="text-sm">Historial de compras, facturación, información de pago</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Datos de Navegación:</h3>
                  <p className="text-sm">IP, navegador, dispositivo, cookies, búsquedas realizadas</p>
                </div>
              </div>
            </div>

            {/* 3. Finalidades */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">3. Para Qué Usamos tus Datos (Finalidades)</h2>

              <div className="mt-3 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Finalidades Necesarias (Requeridas):</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
                    <li>Crear y administrar tu cuenta</li>
                    <li>Prestar los servicios contratados</li>
                    <li>Procesar pagos</li>
                    <li>Enviar notificaciones sobre tu cuenta</li>
                    <li>Responder consultas</li>
                    <li>Cumplir obligaciones legales</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Finalidades Opcionales (Requieren Consentimiento):</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
                    <li>Enviar promociones e información sobre nuevos servicios</li>
                    <li>Realizar análisis y mejora de servicios</li>
                    <li>Personalizar tu experiencia</li>
                    <li>Marketing y publicidad</li>
                  </ul>
                  <p className="mt-2 text-xs text-gray-600">
                    <strong>Nota:</strong> Para estas finalidades, necesitamos tu consentimiento. Puedes darlo o
                    negarlo sin que afecte los servicios básicos.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Consentimiento */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">4. Tu Consentimiento</h2>
              <p className="mt-2 text-gray-700">
                Al crear una cuenta o usar la Plataforma, aceptas el tratamiento de tus datos personales conforme a este
                Aviso.
              </p>
              <p className="mt-2 text-gray-700">
                Para finalidades opcionales, te pediremos consentimiento explícito. Puedes cambiar tus preferencias en
                cualquier momento en tu panel de control.
              </p>
            </div>

            {/* 5. Compartir Datos */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">5. Compartimos tus Datos Con:</h2>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-gray-700">
                <li>
                  <strong>Proveedores de Servicios:</strong> Procesadores de pagos, hosting, email (con estándares de
                  seguridad equivalentes)
                </li>
                <li>
                  <strong>Autoridades:</strong> Cuando la ley lo exija
                </li>
                <li>
                  <strong>Terceros Autorizados:</strong> Solo con tu consentimiento explícito
                </li>
              </ul>
            </div>

            {/* 6. Derechos ARCO */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">6. Tus Derechos (ARCO)</h2>
              <p className="mt-2 text-gray-700">
                Conforme a la LFPDPPP, tienes derecho a:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-gray-700">
                <li>
                  <strong>Acceso:</strong> Conocer qué datos tenemos sobre ti
                </li>
                <li>
                  <strong>Rectificación:</strong> Corregir datos inexactos o incompletos
                </li>
                <li>
                  <strong>Cancelación:</strong> Solicitar la eliminación de tus datos
                </li>
                <li>
                  <strong>Oposición:</strong> Oponerle a usos específicos de tus datos
                </li>
              </ul>
            </div>

            {/* 7. Cómo Ejercer Derechos */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">7. Cómo Ejercer tus Derechos ARCO</h2>
              <p className="mt-2 text-gray-700">
                Envía tu solicitud (indicando claramente qué derecho deseas ejercer) a:
              </p>
              <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm">
                <p>
                  <strong>Email:</strong> privacidad@guiazmg.com
                </p>
                <p className="mt-2">
                  <strong>Teléfono:</strong> (33) 0000-0000
                </p>
                <p className="mt-2">
                  <strong>En línea:</strong> Panel de control &gt; Configuración &gt; Privacidad
                </p>
              </div>
              <p className="mt-3 text-xs text-gray-600">
                Responderemos en máximo 20 días hábiles. Podemos solicitar información para verificar tu identidad.
              </p>
            </div>

            {/* 8. Seguridad */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">8. Protección de tus Datos</h2>
              <p className="mt-2 text-gray-700">
                Implementamos medidas de seguridad técnicas y administrativas:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-gray-700">
                <li>Encriptación SSL/TLS en transmisión de datos</li>
                <li>Acceso restringido a personal autorizado</li>
                <li>Auditorías de seguridad regulares</li>
                <li>Políticas de confidencialidad con proveedores</li>
              </ul>
            </div>

            {/* 9. Cookies */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">9. Cookies y Rastreo</h2>
              <p className="mt-2 text-gray-700">
                Usamos cookies para mejorar tu experiencia. Puedes controlarlas en tu navegador. Lee nuestra Política
                de Privacidad para detalles completos.
              </p>
            </div>

            {/* 10. Retención */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">10. Por Cuánto Tiempo Guardamos tus Datos</h2>
              <p className="mt-2 text-gray-700">
                Conservamos tus datos mientras:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-gray-700">
                <li>Seas usuario activo de la Plataforma</li>
                <li>Sea necesario para cumplir obligaciones legales (mínimo 5 años)</li>
                <li>Haya litigios o asuntos pendientes</li>
              </ul>
              <p className="mt-3 text-sm text-gray-700">
                Después, los datos serán eliminados o anonimizados.
              </p>
            </div>

            {/* 11. Cambios */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">11. Cambios a Este Aviso</h2>
              <p className="mt-2 text-gray-700">
                Podemos actualizar este Aviso. Los cambios significativos serán comunicados por email o aviso en la
                Plataforma. El uso continuado implica aceptación de los cambios.
              </p>
            </div>

            {/* 12. Contacto */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">12. Contacto y Quejas</h2>
              <p className="mt-2 text-gray-700">
                Para preguntas, reclamos o para ejercer derechos ARCO:
              </p>
              <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm">
                <p>
                  <strong>Email:</strong> privacidad@guiazmg.com
                </p>
                <p className="mt-2">
                  <strong>Teléfono:</strong> (33) 0000-0000
                </p>
                <p className="mt-2">
                  <strong>Autoridad Competente:</strong> Si consideras que tus derechos han sido vulnerados, puedes
                  presentar queja ante el{" "}
                  <a href="https://www.gob.mx/inai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI)
                  </a>
                </p>
              </div>
            </div>

            {/* Summary Table */}
            <Card className="overflow-hidden">
              <div className="p-6">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Resumen Rápido</h2>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-4 border-b pb-3">
                    <div className="font-semibold text-gray-900">Pregunta</div>
                    <div className="font-semibold text-gray-900">Respuesta</div>
                    <div className="font-semibold text-gray-900">Acciones</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>¿Qué datos tienes de mí?</div>
                    <div>Nombre, email, datos del negocio, pagos</div>
                    <div>
                      <a href="mailto:privacidad@guiazmg.com" className="text-blue-600 hover:underline">
                        Solicitar Acceso
                      </a>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t pt-3">
                    <div>¿Son mis datos seguros?</div>
                    <div>Sí, usamos encriptación y auditorías</div>
                    <div>
                      <a href="/politica-privacidad" className="text-blue-600 hover:underline">
                        Ver Detalles
                      </a>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t pt-3">
                    <div>¿Venden mis datos?</div>
                    <div>No, solo lo compartimos cuando es necesario</div>
                    <div>
                      <a href="/politica-privacidad" className="text-blue-600 hover:underline">
                        Saber Más
                      </a>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t pt-3">
                    <div>¿Cómo dejo de recibir promociones?</div>
                    <div>Panel de control o email a privacidad@guiazmg.com</div>
                    <div>
                      <a href="#" className="text-blue-600 hover:underline">
                        Actualizar Preferencias
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Final Note */}
            <div className="border-t-2 pt-6">
              <p className="text-xs text-gray-500">
                Este Aviso de Privacidad fue actualizado el 1 de junio de 2026 y cumple con la Ley Federal de
                Protección de Datos Personales en Posesión de Particulares (LFPDPPP).
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Para información completa, consulta la{" "}
                <a href="/politica-privacidad" className="text-blue-600 hover:underline">
                  Política de Privacidad Integral
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
