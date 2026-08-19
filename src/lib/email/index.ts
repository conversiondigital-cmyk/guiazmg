import nodemailer from "nodemailer"
import { getPublicAppUrl } from "@/lib/env"
import { getSetting, getSettingBool } from "@/lib/settings"

const DEFAULT_FROM = "noreply@guiazmg.com"
const APP_URL = getPublicAppUrl()

// ─── Plantilla base de correo (branded) ──────────────────────────────────────
// Todos los correos automáticos se envuelven en este layout: logo, header verde,
// botón de marca, y pie con info del sitio y enlaces. HTML apto para clientes de
// correo (tablas + estilos inline; nada de SVG/flex/clases). El logo es un PNG
// absoluto (los clientes no renderizan SVG).
const BRAND = {
  green: "#003527", // header oscuro
  greenBtn: "#006c49", // botón / enlaces
  accent: "#12a66b", // barra de acento
  ink: "#0b3b2b", // títulos
  text: "#374151", // cuerpo
  muted: "#6b7280", // notas / pie
  page: "#eef2f0", // fondo del correo
  logo: `${APP_URL}/email/logo.png`,
  contact: "contacto@guiazmg.com",
}
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

// Escapa valores provistos por el usuario (nombres, correos, notas) antes de
// interpolarlos en el HTML del correo.
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

// Botón principal (table-based para que Outlook respete el fondo y el radio).
function emailButton(url: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 4px"><tr><td align="center" bgcolor="${BRAND.greenBtn}" style="border-radius:10px"><a href="${url || "#"}" target="_blank" style="display:inline-block;padding:14px 32px;font:700 15px ${FONT};color:#ffffff;text-decoration:none;border-radius:10px">${label}</a></td></tr></table>`
}

interface EmailContent {
  preheader?: string
  heading: string
  body: string // HTML (párrafos, listas…)
  cta?: { url: string; label: string }
  note?: string // aviso secundario en gris
}

function emailLayout(c: EmailContent): string {
  const year = new Date().getFullYear()
  const link = (href: string, text: string) =>
    `<a href="${href}" target="_blank" style="color:${BRAND.greenBtn};text-decoration:none;font-weight:600">${text}</a>`
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${BRAND.page};font-family:${FONT};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(c.preheader || c.heading)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${BRAND.page}" style="background:${BRAND.page}"><tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
    <!-- Header -->
    <tr><td bgcolor="${BRAND.green}" align="center" style="background:${BRAND.green};padding:26px 32px 22px">
      <img src="${BRAND.logo}" width="210" alt="Guía ZMG" style="display:inline-block;width:210px;max-width:64%;height:auto;border:0;outline:none">
      <div style="margin-top:8px;font:600 12px ${FONT};letter-spacing:.12em;text-transform:uppercase;color:#7ff0c0">Tu guía local de negocios</div>
    </td></tr>
    <tr><td style="height:4px;line-height:4px;font-size:0;background:${BRAND.accent}">&nbsp;</td></tr>
    <!-- Body -->
    <tr><td style="padding:34px 32px 10px">
      <h1 style="margin:0 0 14px;font:800 24px/1.25 ${FONT};color:${BRAND.ink}">${c.heading}</h1>
      <div style="font:400 16px/1.6 ${FONT};color:${BRAND.text}">${c.body}</div>
      ${c.cta ? emailButton(c.cta.url, c.cta.label) : ""}
      ${c.note ? `<p style="margin:14px 0 0;font:400 13px/1.55 ${FONT};color:${BRAND.muted}">${c.note}</p>` : ""}
    </td></tr>
    <!-- Footer -->
    <tr><td style="padding:22px 32px 26px;border-top:1px solid ${BRAND.page}">
      <p style="margin:0 0 10px;font:400 14px/1.6 ${FONT};color:${BRAND.text}">
        <strong style="color:${BRAND.ink}">Guía ZMG</strong> — el directorio de negocios, servicios y emprendedores de la Zona Metropolitana de Guadalajara.
      </p>
      <p style="margin:0 0 4px;font:400 14px/1.9 ${FONT};color:${BRAND.text}">
        ${link(APP_URL + "/search", "Explorar")} &nbsp;·&nbsp;
        ${link(APP_URL + "/marketplace", "Marketplace")} &nbsp;·&nbsp;
        ${link(APP_URL + "/agenda", "Agenda")} &nbsp;·&nbsp;
        ${link(APP_URL + "/blog", "Blog")} &nbsp;·&nbsp;
        ${link(APP_URL + "/contacto", "Contacto")}
      </p>
      <p style="margin:6px 0 0;font:400 13px/1.6 ${FONT};color:${BRAND.muted}">
        ${link(APP_URL, "guiazmg.com")} &nbsp;·&nbsp; ${link("mailto:" + BRAND.contact, BRAND.contact)}
      </p>
    </td></tr>
  </table>
  <!-- Sub-footer legal -->
  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:100%"><tr><td align="center" style="padding:16px 24px 4px;font:400 12px/1.6 ${FONT};color:#9ca3af">
    © ${year} Guía ZMG · Zona Metropolitana de Guadalajara, Jalisco, México<br>
    Recibiste este correo porque tienes una cuenta o realizaste una acción en Guía ZMG. Si no lo reconoces, puedes ignorarlo.
  </td></tr></table>
</td></tr></table>
</body></html>`
}

const TEMPLATES: Record<string, (vars: Record<string, string>) => { subject: string; html: string }> = {
  welcome: (v) => ({
    subject: "Te damos la bienvenida a Guía ZMG",
    html: emailLayout({
      preheader: "Tu cuenta está lista. Explora negocios locales, guarda favoritos y más.",
      heading: `¡Bienvenido${v.name ? `, ${esc(v.name)}` : ""}!`,
      body: `<p style="margin:0 0 12px">Gracias por crear tu cuenta en <strong>Guía ZMG</strong>. Ya puedes descubrir negocios y servicios cerca de ti, guardar tus favoritos, dejar reseñas y publicar en el Marketplace.</p><p style="margin:0">¿Tienes un negocio? También puedes registrarlo y llegar a más clientes de tu zona.</p>`,
      cta: { url: v.loginUrl || APP_URL, label: "Entrar a mi cuenta" },
    }),
  }),
  lead: (v) => ({
    subject: `Nuevo contacto para ${v.businessName || "tu negocio"}`,
    html: emailLayout({
      preheader: "Alguien está interesado en tu negocio. Entra a verlo.",
      heading: "Tienes un nuevo contacto",
      body: `<p style="margin:0 0 12px"><strong>${esc(v.userName || "Una persona")}</strong> mostró interés en <strong>${esc(v.businessName || "tu negocio")}</strong> a través de Guía ZMG.</p>${v.message ? `<p style="margin:0 0 12px;padding:12px 16px;background:#f3faf6;border-left:3px solid ${BRAND.accent};border-radius:6px;color:${BRAND.text}">${esc(v.message)}</p>` : ""}<p style="margin:0">Entra a tu panel para ver los datos y responder.</p>`,
      cta: { url: v.dashboardUrl || APP_URL, label: "Ver el contacto" },
    }),
  }),
  business_registered: (v) => ({
    subject: `Nuevo negocio por aprobar: ${v.businessName || ""}`,
    html: emailLayout({
      preheader: "Un negocio nuevo espera revisión.",
      heading: "Nuevo negocio registrado",
      body: `<p style="margin:0"><strong>${esc(v.businessName || "")}</strong> se registró en Guía ZMG y está pendiente de aprobación${v.ownerName ? ` (dueño: ${esc(v.ownerName)})` : ""}.</p>`,
      cta: { url: v.reviewUrl || APP_URL, label: "Revisar y aprobar" },
    }),
  }),
  giro_suggested: (v) => ({
    subject: `Nuevo giro solicitado: ${v.giro || ""}`,
    html: emailLayout({
      preheader: "Un usuario pidió agregar un giro nuevo al catálogo.",
      heading: "Solicitud de giro nuevo",
      body: `<p style="margin:0 0 12px">Un usuario no encontró su giro en el catálogo y solicitó agregarlo:</p><ul style="margin:0;padding-left:20px;color:${BRAND.text}"><li style="margin-bottom:4px"><strong>Giro:</strong> ${esc(v.giro || "")}</li>${v.categoryHint ? `<li style="margin-bottom:4px"><strong>Categoría sugerida:</strong> ${esc(v.categoryHint)}</li>` : ""}${v.businessName ? `<li style="margin-bottom:4px"><strong>Negocio:</strong> ${esc(v.businessName)}</li>` : ""}${v.note ? `<li style="margin-bottom:4px"><strong>Detalle:</strong> ${esc(v.note)}</li>` : ""}${v.contactEmail ? `<li style="margin-bottom:4px"><strong>Contacto:</strong> ${esc(v.contactEmail)}</li>` : ""}</ul>`,
      cta: { url: v.reviewUrl || APP_URL, label: "Revisar solicitudes de giro" },
    }),
  }),
  renewal_reminder: (v) => ({
    subject: `Tu membresía está por vencer${v.businessName ? ` — ${v.businessName}` : ""}`,
    html: emailLayout({
      preheader: "Renueva para que tu negocio siga visible en el directorio.",
      heading: "Tu membresía vence pronto",
      body: `<p style="margin:0">Tu membresía de <strong>${esc(v.planName || "Guía ZMG")}</strong> vence el <strong>${esc(v.expiryDate || "pronto")}</strong>. Renuévala para que tu negocio siga apareciendo en Guía ZMG sin interrupciones.</p>`,
      cta: { url: v.renewalUrl || APP_URL, label: "Renovar ahora" },
    }),
  }),
  review_request: (v) => ({
    subject: `¿Cómo fue tu experiencia con ${v.businessName || "el negocio"}?`,
    html: emailLayout({
      preheader: "Tu opinión ayuda a otros a decidir.",
      heading: "Cuéntanos tu experiencia",
      body: `<p style="margin:0">¿Qué tal te fue con <strong>${esc(v.businessName || "el negocio")}</strong>? Tu reseña ayuda a otras personas de la ZMG a elegir mejor.</p>`,
      cta: { url: v.reviewUrl || APP_URL, label: "Dejar mi reseña" },
    }),
  }),
  boost_ended: (v) => ({
    subject: `Tu boost ha terminado${v.businessName ? ` — ${v.businessName}` : ""}`,
    html: emailLayout({
      preheader: "Vuelve a destacar tu negocio cuando quieras.",
      heading: "Tu boost ha terminado",
      body: `<p style="margin:0">El boost de <strong>${esc(v.businessName || "tu negocio")}</strong> ha finalizado. Puedes activar uno nuevo cuando quieras para volver a aparecer entre los destacados.</p>`,
      cta: { url: v.boostUrl || APP_URL, label: "Activar nuevo boost" },
    }),
  }),
  // Al DUEÑO cuando su negocio/emprendimiento queda activo y visible en el directorio
  // (por pago, cupón de prueba o aprobación del admin).
  business_activated: (v) => ({
    subject: `¡${v.businessName || "Tu negocio"} ya está activo en Guía ZMG!`,
    html: emailLayout({
      preheader: "Tu negocio ya aparece en el directorio. Completa tu perfil.",
      heading: `¡Ya estás en Guía ZMG${v.ownerName ? `, ${esc(v.ownerName)}` : ""}!`,
      body: `<p style="margin:0 0 12px"><strong>${esc(v.businessName || "Tu negocio")}</strong> quedó activo y ya aparece en el directorio${v.planName ? ` con tu plan <strong>${esc(v.planName)}</strong>` : ""}.</p><p style="margin:0">Completa tu perfil (fotos, horarios, descripción y catálogo) para atraer a más clientes.</p>`,
      cta: { url: v.dashboardUrl || APP_URL, label: "Ir a mi panel" },
    }),
  }),
  // Al DUEÑO cuando su negocio deja de estar visible: suspensión por el admin o
  // baja automática al vencer la membresía. `reason` explica el motivo.
  business_suspended: (v) => ({
    subject: `${v.businessName || "Tu negocio"} dejó de estar visible en Guía ZMG`,
    html: emailLayout({
      preheader: "Renueva tu plan para reactivarlo.",
      heading: "Tu negocio ya no aparece en el directorio",
      body: `<p style="margin:0"><strong>${esc(v.businessName || "Tu negocio")}</strong> dejó de mostrarse en Guía ZMG${v.reason ? `: ${esc(v.reason)}` : "."}. Para reactivarlo, renueva tu plan o escríbenos si crees que fue un error.</p>`,
      cta: { url: v.membershipUrl || APP_URL, label: "Reactivar mi negocio" },
      note: "¿Dudas? Responde a este correo y te ayudamos.",
    }),
  }),
  // Al DUEÑO cuando su negocio obtiene la insignia de Verificado.
  business_verified: (v) => ({
    subject: `${v.businessName || "Tu negocio"} ya está verificado en Guía ZMG`,
    html: emailLayout({
      preheader: "Tu negocio ahora muestra la insignia de Verificado.",
      heading: "¡Tu negocio fue verificado!",
      body: `<p style="margin:0"><strong>${esc(v.businessName || "Tu negocio")}</strong> ahora muestra la insignia de <strong>Verificado</strong> en Guía ZMG, lo que da más confianza a tus clientes.</p>`,
      cta: { url: v.profileUrl || APP_URL, label: "Ver mi perfil" },
    }),
  }),
  inactive_business: (v) => ({
    subject: `Tu negocio ${v.businessName || ""} — ¿cómo podemos ayudarte?`,
    html: emailLayout({
      preheader: "Termina de configurar tu perfil para empezar a recibir clientes.",
      heading: "Tu negocio sigue esperando",
      body: `<p style="margin:0">Aún no terminas de configurar <strong>${esc(v.businessName || "tu negocio")}</strong>. Completa tu perfil para empezar a aparecer y recibir contactos en Guía ZMG.</p>`,
      cta: { url: v.dashboardUrl || APP_URL, label: "Completar mi perfil" },
    }),
  }),
  reset_password: (v) => ({
    subject: "Restablece tu contraseña de Guía ZMG",
    html: emailLayout({
      preheader: "Crea una nueva contraseña. El enlace expira en 1 hora.",
      heading: "Restablece tu contraseña",
      body: `<p style="margin:0">Recibimos una solicitud para restablecer la contraseña de tu cuenta en Guía ZMG. Haz clic en el botón para crear una nueva:</p>`,
      cta: { url: v.resetUrl || APP_URL, label: "Crear nueva contraseña" },
      note: "Este enlace expira en 1 hora. Si no solicitaste el cambio, ignora este correo: tu contraseña seguirá igual.",
    }),
  }),
  verify_email: (v) => ({
    subject: "Activa tu cuenta de Guía ZMG",
    html: emailLayout({
      preheader: "Confirma tu correo para activar tu cuenta.",
      heading: `¡Casi listo${v.name ? `, ${esc(v.name)}` : ""}!`,
      body: `<p style="margin:0">Confirma tu correo para activar tu cuenta en Guía ZMG y empezar a explorar negocios y servicios cerca de ti.</p>`,
      cta: { url: v.verifyUrl || APP_URL, label: "Activar mi cuenta" },
      note: "El enlace expira en 24 horas. Si no creaste esta cuenta, ignora este correo.",
    }),
  }),
  // Se envía al correo NUEVO: el cambio solo se aplica al confirmar este enlace.
  verify_email_change: (v) => ({
    subject: "Confirma tu nuevo correo — Guía ZMG",
    html: emailLayout({
      preheader: "Confirma esta dirección para aplicar el cambio.",
      heading: "Confirma tu nuevo correo",
      body: `<p style="margin:0">Se solicitó cambiar el correo de una cuenta de Guía ZMG a esta dirección. Para confirmarlo y activarlo, haz clic en el botón:</p>`,
      cta: { url: v.verifyUrl || APP_URL, label: "Confirmar nuevo correo" },
      note: "El enlace expira en 24 horas. Si no fuiste tú, ignora este correo: la cuenta seguirá con su correo actual.",
    }),
  }),
  // Aviso de seguridad al correo ANTERIOR cuando alguien pide cambiarlo.
  email_change_alert: (v) => ({
    subject: "Se solicitó cambiar el correo de tu cuenta — Guía ZMG",
    html: emailLayout({
      preheader: "Aviso de seguridad de tu cuenta.",
      heading: "Solicitud de cambio de correo",
      body: `<p style="margin:0 0 12px">Se pidió cambiar el correo de tu cuenta de Guía ZMG a <strong>${esc(v.newEmail || "")}</strong>. El cambio solo se aplica cuando se confirme desde ese correo nuevo.</p><p style="margin:0">Si <strong>no</strong> fuiste tú, cambia tu contraseña de inmediato y contáctanos: el cambio aún no se ha aplicado.</p>`,
      note: "Este es un aviso de seguridad automático; no es necesario que respondas si reconoces la solicitud.",
    }),
  }),
}

// Construye el transporte SMTP leyendo la config del admin (Admin → Configuración
// → Correo SMTP) con respaldo a variables de entorno. Devuelve null si no hay host
// configurado, en cuyo caso el envío se omite sin romper la petición.
async function getMailer(): Promise<{ transporter: nodemailer.Transporter; from: string; replyTo: string } | null> {
  const host = await getSetting("smtp_host", "SMTP_HOST")
  if (!host) return null
  const [port, user, pass, from, secure, contactEmail] = await Promise.all([
    getSetting("smtp_port", "SMTP_PORT"),
    getSetting("smtp_username", "SMTP_USER"),
    getSetting("smtp_password", "SMTP_PASS"),
    getSetting("smtp_from_email", "SMTP_FROM"),
    getSettingBool("smtp_tls_enabled", "SMTP_SECURE"),
    getSetting("contact_email"),
  ])
  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port || "587"),
    secure,
    auth: { user, pass },
  })
  // Reply-To = buzón de contacto: los correos salen "de" noreply/SMTP_FROM pero las
  // respuestas llegan a contacto@ (buzón humano monitoreado), no a un buzón muerto.
  return { transporter, from: from || DEFAULT_FROM, replyTo: contactEmail || CONTACT_EMAIL }
}

// Correo del buzón de contacto: destino de los avisos de admin y Reply-To de todos
// los correos. Configurable en Admin → Config → Contacto (contact_email).
const CONTACT_EMAIL = "contacto@guiazmg.com"
export async function getAdminNotifyEmail(): Promise<string> {
  return (await getSetting("contact_email")) || CONTACT_EMAIL
}

export async function sendEmail(
  to: string,
  template: string,
  variables: Record<string, string>,
  userId?: string,
) {
  const tpl = TEMPLATES[template]
  if (!tpl) throw new Error(`Unknown template: ${template}`)

  const { subject, html } = tpl(variables)
  const { prisma } = await import("@/lib/prisma")

  try {
    const mailer = await getMailer()
    if (mailer) {
      await mailer.transporter.sendMail({ from: mailer.from, replyTo: mailer.replyTo, to, subject, html })
    } else {
      // SMTP no configurado: se omite el envío sin romper la petición.
      console.log(`[EMAIL OMITIDO] [${template}] Para: ${to} | Asunto: ${subject}`)
    }
    if (userId) {
      await prisma.emailLog.create({ data: { userId, to, subject, template, sentAt: new Date() } }).catch(() => {})
    }
    return true
  } catch (err: any) {
    console.error(`Failed to send email (${template} to ${to}):`, err.message)
    try {
      await prisma.emailLog.create({ data: { userId, to, subject, template, failedAt: new Date() } }).catch((e) => {
        console.error("[EMAIL_LOG_CREATE_ERROR]", e instanceof Error ? e.message : String(e))
      })
    } catch (error) {
      console.error("[EMAIL_SEND_FALLBACK_ERROR]", error instanceof Error ? error.message : String(error))
    }
    return false
  }
}

export async function sendWelcomeEmail(user: { id: string; name?: string | null; email: string }) {
  return sendEmail(user.email, "welcome", { name: user.name || "", loginUrl: `${APP_URL}/auth/login` }, user.id)
}

export async function sendLeadNotification(businessOwnerEmail: string, data: { businessName: string; userName: string; message?: string }) {
  return sendEmail(businessOwnerEmail, "lead", { ...data, dashboardUrl: `${APP_URL}/dashboard/leads` })
}

export async function sendRenewalReminder(email: string, data: { businessName?: string; planName: string; expiryDate: string }) {
  return sendEmail(email, "renewal_reminder", { ...data, renewalUrl: `${APP_URL}/dashboard/membresia` })
}

export async function sendPasswordResetEmail(email: string, resetUrl: string, userId?: string) {
  return sendEmail(email, "reset_password", { resetUrl }, userId)
}

export async function sendVerificationEmail(
  email: string,
  verifyUrl: string,
  name?: string | null,
  userId?: string,
) {
  return sendEmail(email, "verify_email", { verifyUrl, name: name || "" }, userId)
}

// Avisa al dueño que su negocio quedó ACTIVO y visible (pago, cupón o aprobación).
export async function sendBusinessActivatedEmail(
  email: string,
  data: { businessName: string; ownerName?: string | null; planName?: string | null },
  userId?: string,
) {
  return sendEmail(
    email,
    "business_activated",
    {
      businessName: data.businessName,
      ownerName: data.ownerName || "",
      planName: data.planName || "",
      dashboardUrl: `${APP_URL}/dashboard`,
    },
    userId,
  )
}

// Avisa al dueño que su negocio dejó de estar visible (suspensión o vencimiento).
export async function sendBusinessSuspendedEmail(
  email: string,
  data: { businessName: string; reason?: string | null },
  userId?: string,
) {
  return sendEmail(
    email,
    "business_suspended",
    {
      businessName: data.businessName,
      reason: data.reason || "",
      membershipUrl: `${APP_URL}/dashboard/membresia`,
    },
    userId,
  )
}

// Avisa al dueño que su negocio obtuvo la insignia de Verificado.
export async function sendBusinessVerifiedEmail(
  email: string,
  data: { businessName: string; profileSlug?: string | null },
  userId?: string,
) {
  return sendEmail(
    email,
    "business_verified",
    {
      businessName: data.businessName,
      profileUrl: data.profileSlug ? `${APP_URL}/perfil/${data.profileSlug}` : `${APP_URL}/dashboard/negocio`,
    },
    userId,
  )
}
