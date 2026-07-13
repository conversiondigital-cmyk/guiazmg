import { Metadata } from "next"
import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { LegalMarkdown } from "@/components/legal/legal-markdown"

export const metadata: Metadata = {
  title: "Términos y Condiciones | Guía ZMG",
  description: "Términos y condiciones de uso de Guía ZMG.",
}

// Documento fuente en Markdown (se limpian los corchetes de correos y del sitio).
const RAW = `
## 1. Aceptación de los términos

Al acceder, navegar, registrarte, publicar contenido, crear un perfil, reclamar un negocio, contratar una membresía, comprar un boost o utilizar cualquier función de Guía ZMG, aceptas estos Términos y Condiciones de Uso, así como la Política de Privacidad y las Normas de Comunidad de la plataforma.

Si no estás de acuerdo con estos términos, deberás abstenerte de utilizar el sitio.

Guía ZMG podrá actualizar estos términos en cualquier momento. Cuando los cambios sean relevantes, procuraremos notificarlo mediante el sitio, correo electrónico, panel de usuario u otros medios razonables. El uso continuo de la plataforma después de la publicación de cambios implica la aceptación de los términos modificados.

## 2. Naturaleza de la plataforma

Guía ZMG es una plataforma tecnológica, informativa y comercial de carácter hiperlocal que permite a usuarios, emprendedores, negocios y prestadores de servicios publicar, consultar, buscar, promocionar y contactar perfiles comerciales, productos, servicios, promociones, publicaciones de marketplace, reseñas y contenido editorial relacionado con la Zona Metropolitana de Guadalajara y otras zonas que puedan incorporarse en el futuro.

Guía ZMG no es propietaria de los productos o servicios publicados por terceros, no es parte directa de las operaciones entre usuarios y negocios, y no garantiza por sí misma la calidad, disponibilidad, seguridad, legalidad, idoneidad, precio, identidad o veracidad absoluta de lo publicado por usuarios, vendedores o terceros.

La plataforma funciona como medio de conexión, visibilidad, búsqueda, promoción y contacto.

## 3. Tipos de usuarios

Dentro de Guía ZMG pueden existir, entre otros, los siguientes tipos de usuarios:

1. **Usuario normal:** persona que consulta la plataforma, busca negocios, guarda favoritos, publica en marketplace si está permitido, deja reseñas o contacta negocios.
2. **Vendedor Emprendedor:** persona física o pequeño vendedor local que publica un perfil comercial, productos, servicios o promociones de baja escala.
3. **Vendedor Negocio:** negocio, establecimiento, profesional, prestador de servicios o entidad comercial con operación más formal o amplia.
4. **Editor:** usuario autorizado para crear, editar o publicar contenido editorial, blog, artículos y páginas informativas dentro de la plataforma.
5. **Administrador:** usuario con permisos internos de operación, configuración, moderación, seguridad, gestión comercial y administración general de la plataforma.

Guía ZMG podrá crear, modificar o eliminar roles, permisos y funcionalidades conforme evolucione el servicio.

## 4. Registro de cuenta

Para utilizar determinadas funciones puede ser necesario crear una cuenta, iniciar sesión con correo, contraseña, Google OAuth u otro método habilitado por la plataforma.

Al registrarte declaras que:

- La información proporcionada es verdadera, actual, completa y verificable.
- Tienes capacidad legal para aceptar estos términos.
- No utilizarás la plataforma con fines fraudulentos, ilegales, engañosos o abusivos.
- Mantendrás actualizados tus datos de contacto.
- Eres responsable de proteger tus credenciales de acceso.

Guía ZMG no será responsable por accesos no autorizados derivados de descuido, pérdida, filtración o uso indebido de tus credenciales.

## 5. Perfiles comerciales

Los vendedores podrán crear o administrar perfiles comerciales para mostrar información como nombre del negocio, giro, descripción, productos, servicios, promociones, fotografías, zona de atención, horarios, enlaces, WhatsApp, teléfono, ubicación aproximada o exacta y otros datos relevantes.

El vendedor declara y garantiza que:

- Tiene derecho a publicar la información del negocio.
- La información es veraz, comprobable y no induce a error.
- Cuenta con autorización para usar marcas, fotografías, logotipos, textos, precios, promociones y cualquier contenido publicado.
- Los productos o servicios ofrecidos son lícitos.
- Cumple con obligaciones fiscales, sanitarias, comerciales, regulatorias o profesionales que le resulten aplicables.
- No publica información falsa, engañosa, discriminatoria, ofensiva o que vulnere derechos de terceros.

Guía ZMG podrá solicitar documentación, aclaraciones o evidencia cuando exista duda razonable sobre la titularidad, legitimidad, identidad o veracidad de un perfil.

## 6. Perfiles no reclamados o sugeridos

Guía ZMG podrá permitir la existencia de perfiles básicos no reclamados, sugeridos por usuarios, capturados por investigación propia, generados a partir de fuentes públicas permitidas o creados como referencia local.

Dichos perfiles deberán identificarse como "perfil no reclamado", "pendiente de verificación" o una leyenda similar.

Un perfil no reclamado no implica que el negocio esté afiliado, registrado, verificado, patrocinado o administrado por Guía ZMG.

El propietario o representante legítimo de un negocio podrá solicitar reclamar el perfil, corregir información básica, actualizar datos, reportar información incorrecta o solicitar eliminación o despublicación cuando proceda.

Guía ZMG no cobrará por solicitar correcciones básicas, eliminación justificada o reclamación inicial de identidad. Las membresías y servicios de pago corresponden a funciones adicionales, tales como administración avanzada, catálogo, promociones, métricas, posicionamiento, verificación, boosts o beneficios comerciales.

## 7. Marketplace y publicaciones temporales

Guía ZMG podrá ofrecer un módulo de marketplace o clasificados donde los usuarios publiquen productos, servicios, solicitudes, ventas ocasionales, promociones, anuncios comunitarios u otros contenidos permitidos.

Cada usuario es responsable de la veracidad de lo publicado, de contar con derecho para vender u ofrecer el bien o servicio, de entregar lo ofrecido en las condiciones pactadas, de cumplir con garantías o acuerdos aplicables y de evitar productos robados, falsificados, peligrosos, ilegales o prohibidos.

Guía ZMG no garantiza que las transacciones entre usuarios se completen, ni interviene necesariamente en pagos, entregas, devoluciones, garantías, calidad o disputas, salvo que una función específica de la plataforma indique lo contrario.

## 8. Productos, servicios, precios y promociones

Los vendedores son responsables de mantener actualizada la información de sus productos, servicios, precios, disponibilidad, condiciones, vigencia, restricciones, zonas de entrega, garantías y promociones.

Toda promoción deberá ser clara, veraz, comprobable y no engañosa. Si una promoción tiene condiciones, vigencia, cantidad limitada, zona específica, restricciones o requisitos, estos deberán informarse de forma clara.

Guía ZMG podrá ocultar, suspender o eliminar publicaciones que aparenten ser falsas, engañosas, abusivas, ilegales, discriminatorias o contrarias a estos términos.

## 9. Membresías y boosts

Guía ZMG podrá ofrecer planes de membresía y servicios adicionales de visibilidad o posicionamiento, tales como Plan Emprendimiento, Plan Negocio y boosts temporales por 7, 15, 30, 90 días u otros periodos publicados en la plataforma.

Los precios, beneficios, límites, duración, impuestos, medios de pago y condiciones específicas se mostrarán antes de contratar.

Los boosts otorgan mayor visibilidad temporal dentro de la plataforma, pero no garantizan ventas, clientes, contactos, ingresos, posicionamiento absoluto ni resultados comerciales determinados.

Guía ZMG podrá modificar precios, beneficios o condiciones de planes y boosts. Los cambios no afectarán servicios ya pagados durante su vigencia, salvo causa legal, técnica, fraude, abuso o incumplimiento.

## 10. Pagos, facturación, renovaciones y cancelaciones

Los pagos podrán procesarse mediante proveedores externos, como Mercado Pago, Stripe u otros que se habiliten. El usuario acepta que dichos proveedores pueden tener sus propios términos, políticas y condiciones.

Salvo que se indique lo contrario:

- Las membresías son de pago mensual o por el periodo contratado.
- Los boosts se pagan por adelantado y duran el periodo elegido.
- La cancelación de una membresía evita renovaciones futuras, pero no necesariamente genera reembolso del periodo ya iniciado.
- Guía ZMG podrá suspender beneficios si el pago falla, se revierte, se cancela, se desconoce o se detecta fraude.
- Las solicitudes de factura deberán realizarse conforme a las instrucciones publicadas en la plataforma.

## 11. Reseñas, calificaciones y comentarios

Los usuarios podrán publicar reseñas, opiniones o calificaciones cuando la plataforma lo permita.

Las reseñas deberán basarse en experiencias reales, honestas y relevantes. Está prohibido publicar reseñas falsas, compradas, manipuladas, ofensivas, discriminatorias, extorsivas, de competidores con mala fe o generadas artificialmente.

Guía ZMG podrá moderar, ocultar o eliminar reseñas que incumplan las Normas de Comunidad, estos términos o la legislación aplicable. La publicación de una reseña no implica que Guía ZMG la valide como verdadera.

## 12. Contenido editorial y blog

El contenido editorial, artículos, guías, rankings, recomendaciones, publicaciones informativas y textos del blog tienen fines informativos, promocionales o de orientación general.

Guía ZMG procurará que el contenido sea útil y actualizado, pero no garantiza que toda la información sea completa, exacta, vigente o aplicable a todos los casos.

Cuando se mencionen negocios, categorías, zonas o servicios, ello no implica necesariamente patrocinio, afiliación, recomendación absoluta o garantía de resultados, salvo que se indique expresamente.

## 13. Propiedad intelectual

Guía ZMG, su diseño, marca, logotipos, software, interfaz, estructura, base de datos, textos propios, código, funcionalidades, gráficos y demás elementos de la plataforma son propiedad de Guía ZMG o de sus respectivos titulares.

Los usuarios conservan los derechos sobre el contenido que suben a la plataforma, pero otorgan a Guía ZMG una licencia no exclusiva, gratuita, mundial y revocable conforme a la naturaleza del servicio, para almacenar, reproducir, mostrar, adaptar técnicamente, distribuir y comunicar dicho contenido dentro de la plataforma, en buscadores, redes sociales, materiales promocionales y canales relacionados con la difusión del perfil o publicación.

El usuario declara que cuenta con derechos o autorización para subir imágenes, logotipos, fotografías, videos, textos, marcas, nombres comerciales o cualquier contenido de terceros.

Está prohibido copiar, extraer, reutilizar, revender, raspar, clonar o explotar la información, estructura o contenido de Guía ZMG sin autorización.

## 14. Contenido prohibido

Está prohibido publicar, ofrecer, promover o facilitar contenido, productos o servicios que sean ilegales, fraudulentos, engañosos, peligrosos, violentos, discriminatorios, robados, falsificados, invasivos, difamatorios, maliciosos o contrarios a las Normas de Comunidad.

De manera enunciativa, no limitativa, se prohíbe:

- suplantación de identidad;
- fraude, estafas o esquemas engañosos;
- venta de productos robados o falsificados;
- amenazas, acoso, discriminación o discurso de odio;
- malware, phishing, hacking o acceso no autorizado;
- contenido sexual explícito no permitido;
- contenido íntimo de terceros sin consentimiento;
- armas, drogas, medicamentos controlados o productos regulados sin autorización;
- servicios ilegales;
- datos personales de terceros sin autorización;
- spam o automatización abusiva;
- manipulación de reseñas, métricas o rankings.

## 15. Moderación, suspensión y eliminación

Guía ZMG podrá, sin obligación de aviso previo, revisar, ocultar, limitar, suspender, eliminar o despublicar contenido, perfiles, publicaciones, reseñas, productos, servicios, promociones o cuentas cuando considere que existe incumplimiento de estos términos, riesgo para usuarios, reportes razonables, obligación legal, fraude, abuso, información falsa, riesgo reputacional, riesgo operativo o uso indebido de la plataforma.

Guía ZMG podrá habilitar procesos de apelación o revisión, pero no está obligada a restituir contenido cuando exista riesgo o incumplimiento.

## 16. Reglas contra scraping, automatización y abuso

Está prohibido acceder a Guía ZMG mediante bots, scrapers, crawlers no autorizados, extracción masiva, ingeniería inversa, abuso de APIs, evasión de límites, creación masiva de cuentas, automatización engañosa o cualquier técnica que afecte la seguridad, disponibilidad, integridad, costos o funcionamiento de la plataforma.

Guía ZMG podrá bloquear IPs, usuarios, tokens, sesiones, dispositivos, solicitudes o integraciones cuando detecte abuso.

## 17. Relación entre usuarios, vendedores y terceros

Las relaciones, negociaciones, cotizaciones, pagos, entregas, garantías, devoluciones, cancelaciones, visitas, servicios o acuerdos entre usuarios y vendedores son responsabilidad de las partes involucradas.

Guía ZMG no será responsable por daños, pérdidas, incumplimientos, accidentes, fraudes, productos defectuosos, servicios deficientes, falta de pago, falta de entrega, desacuerdos, garantías o conflictos derivados de transacciones realizadas entre terceros, salvo que la ley establezca una responsabilidad directa no renunciable.

Recomendamos verificar identidad, reputación, ubicación, condiciones, precios y antecedentes antes de contratar o comprar.

## 18. Limitación de responsabilidad

Guía ZMG se proporciona "tal cual" y "según disponibilidad". No garantizamos que el servicio sea ininterrumpido, libre de errores, libre de ataques, libre de fallas, siempre compatible, siempre disponible o siempre actualizado.

En la máxima medida permitida por la ley, Guía ZMG no será responsable por daños indirectos, pérdida de ingresos, pérdida de datos, pérdida de oportunidades, daño reputacional, interrupciones, errores de terceros, problemas de conectividad, fallas de proveedores externos o decisiones tomadas con base en información publicada por usuarios.

## 19. Disponibilidad, mantenimiento y cambios

Guía ZMG podrá modificar, suspender, limitar, actualizar o eliminar funciones, diseños, planes, precios, módulos o integraciones para mejorar el servicio, cumplir con la ley, corregir errores, reducir abuso o ajustar la operación.

Podrán existir periodos de mantenimiento, degradación de servicio, errores técnicos o interrupciones temporales.

## 20. Privacidad y datos personales

El tratamiento de datos personales se regirá por la Política de Privacidad de Guía ZMG, que forma parte integral de estos términos.

Al usar la plataforma aceptas que tus datos se traten conforme a dicha política y a la legislación mexicana aplicable en materia de protección de datos personales.

## 21. Comunicaciones

Guía ZMG podrá enviarte comunicaciones relacionadas con registro y seguridad, verificación de cuenta, actividad de tu perfil, publicaciones, membresías y pagos, boosts, notificaciones operativas, cambios en términos o políticas, y promociones o información comercial cuando corresponda.

Podrás cancelar comunicaciones promocionales cuando el mecanismo esté disponible, sin afectar comunicaciones necesarias para la operación, seguridad o cumplimiento legal.

## 22. Terminación

El usuario puede dejar de utilizar la plataforma y solicitar la eliminación o desactivación de su cuenta conforme a la Política de Privacidad y los procedimientos disponibles.

Guía ZMG podrá terminar, suspender o limitar el acceso de un usuario cuando exista incumplimiento, fraude, abuso, riesgo, requerimiento legal, inactividad prolongada o uso contrario a la naturaleza del servicio.

## 23. Ley aplicable y jurisdicción

Estos términos se regirán por las leyes aplicables de los Estados Unidos Mexicanos.

En caso de controversia, las partes procurarán resolverla de buena fe mediante los canales de contacto de Guía ZMG. Cuando no sea posible, las partes se someterán a las autoridades competentes conforme a la legislación mexicana aplicable, sin perjuicio de los derechos irrenunciables que correspondan a consumidores o titulares de datos personales.

## 24. Contacto

Para dudas, aclaraciones, reportes, solicitudes legales, reclamaciones de perfil, quejas o ejercicio de derechos relacionados con la plataforma, puedes escribir a:

- **Correo:** contacto@guiazmg.com
- **Sitio:** www.guiazmg.com
`

export default function TerminosPage() {
  return (
    <LegalPageShell title="Términos y Condiciones de Uso" updated="9 de julio de 2026">
      <LegalMarkdown content={RAW} />
    </LegalPageShell>
  )
}
