import nodemailer from "nodemailer"
import { getPublicAppUrl } from "@/lib/env"
import { getSetting, getSettingBool } from "@/lib/settings"

const DEFAULT_FROM = "noreply@guiazmg.com"
const APP_URL = getPublicAppUrl()

const TEMPLATES: Record<string, (vars: Record<string, string>) => { subject: string; html: string }> = {
  welcome: (v) => ({
    subject: "Bienvenido a Guía ZMG",
    html: `<h1>¡Bienvenido${v.name ? `, ${v.name}` : ""}!</h1><p>Gracias por registrarte en Guía ZMG.</p><p><a href="${v.loginUrl || "#"}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Comenzar</a></p>`,
  }),
  lead: (v) => ({
    subject: `Nuevo lead de ${v.businessName || "tu negocio"}`,
    html: `<h1>Nuevo contacto</h1><p>Has recibido un nuevo lead.</p><p><a href="${v.dashboardUrl || "#"}">Ver en el panel</a></p>`,
  }),
  business_registered: (v) => ({
    subject: `Nuevo negocio por aprobar: ${v.businessName || ""}`,
    html: `<h1>Nuevo negocio registrado</h1><p><strong>${v.businessName || ""}</strong> se registró en Guía ZMG y está pendiente de aprobación${v.ownerName ? ` (dueño: ${v.ownerName})` : ""}.</p><p><a href="${v.reviewUrl || "#"}" style="background:#003527;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Revisar y aprobar</a></p>`,
  }),
  giro_suggested: (v) => ({
    subject: `Nuevo giro solicitado: ${v.giro || ""}`,
    html: `<h1>Solicitud de giro nuevo</h1><p>Un usuario no encontró su giro en el catálogo y solicitó agregarlo:</p><ul><li><strong>Giro:</strong> ${v.giro || ""}</li>${v.categoryHint ? `<li><strong>Categoría sugerida:</strong> ${v.categoryHint}</li>` : ""}${v.businessName ? `<li><strong>Negocio:</strong> ${v.businessName}</li>` : ""}${v.note ? `<li><strong>Detalle:</strong> ${v.note}</li>` : ""}${v.contactEmail ? `<li><strong>Contacto:</strong> ${v.contactEmail}</li>` : ""}</ul><p><a href="${v.reviewUrl || "#"}" style="background:#003527;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Revisar solicitudes de giro</a></p>`,
  }),
  renewal_reminder: (v) => ({
    subject: `Tu membresía está por vencer${v.businessName ? ` - ${v.businessName}` : ""}`,
    html: `<h1>Tu membresía vence pronto</h1><p>Tu membresía de <strong>${v.planName || "Guía ZMG"}</strong> vence el <strong>${v.expiryDate || "pronto"}</strong>.</p><p><a href="${v.renewalUrl || "#"}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Renovar ahora</a></p>`,
  }),
  review_request: (v) => ({
    subject: `¿Cómo fue tu experiencia con ${v.businessName || "el negocio"}?`,
    html: `<h1>Cuéntanos tu experiencia</h1><p><a href="${v.reviewUrl || "#"}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Dejar reseña</a></p>`,
  }),
  boost_ended: (v) => ({
    subject: `Tu boost ha terminado${v.businessName ? ` - ${v.businessName}` : ""}`,
    html: `<h1>Tu boost ha terminado</h1><p>El boost de <strong>${v.businessName || "tu negocio"}</strong> ha finalizado.</p><p><a href="${v.boostUrl || "#"}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Activar nuevo boost</a></p>`,
  }),
  // Al DUEÑO cuando su negocio/emprendimiento queda activo y visible en el directorio
  // (por pago, cupón de prueba o aprobación del admin).
  business_activated: (v) => ({
    subject: `¡${v.businessName || "Tu negocio"} ya está activo en Guía ZMG!`,
    html: `<h1>¡Ya estás en Guía ZMG${v.ownerName ? `, ${v.ownerName}` : ""}!</h1><p><strong>${v.businessName || "Tu negocio"}</strong> quedó activo y ya aparece en el directorio${v.planName ? ` con tu plan <strong>${v.planName}</strong>` : ""}.</p><p>Completa tu perfil (fotos, horarios, descripción) para atraer más clientes.</p><p><a href="${v.dashboardUrl || "#"}" style="background:#003527;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Ir a mi panel</a></p>`,
  }),
  // Al DUEÑO cuando su negocio deja de estar visible: suspensión por el admin o
  // baja automática al vencer la membresía. `reason` explica el motivo.
  business_suspended: (v) => ({
    subject: `${v.businessName || "Tu negocio"} dejó de estar visible en Guía ZMG`,
    html: `<h1>Tu negocio ya no aparece en el directorio</h1><p><strong>${v.businessName || "Tu negocio"}</strong> dejó de mostrarse en Guía ZMG${v.reason ? `: ${v.reason}` : "."}.</p><p>Para reactivarlo, renueva tu plan o escríbenos si crees que fue un error.</p><p><a href="${v.membershipUrl || "#"}" style="background:#003527;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Reactivar mi negocio</a></p><p style="font-size:13px;color:#6b7280">¿Dudas? Responde a este correo y te ayudamos.</p>`,
  }),
  // Al DUEÑO cuando su negocio obtiene la insignia de Verificado.
  business_verified: (v) => ({
    subject: `${v.businessName || "Tu negocio"} ya está verificado en Guía ZMG`,
    html: `<h1>¡Tu negocio fue verificado! ✓</h1><p><strong>${v.businessName || "Tu negocio"}</strong> ahora muestra la insignia de <strong>Verificado</strong> en Guía ZMG, lo que da más confianza a tus clientes.</p><p><a href="${v.profileUrl || "#"}" style="background:#003527;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Ver mi perfil</a></p>`,
  }),
  inactive_business: (v) => ({
    subject: `Tu negocio ${v.businessName || ""} - ¿Cómo podemos ayudarte?`,
    html: `<h1>Tu negocio sigue esperando</h1><p><a href="${v.dashboardUrl || "#"}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Completar mi perfil</a></p>`,
  }),
  reset_password: (v) => ({
    subject: "Restablece tu contraseña de Guía ZMG",
    html: `<h1>Restablecer contraseña</h1><p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p><p><a href="${v.resetUrl || "#"}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Restablecer contraseña</a></p><p>Este enlace expira en 1 hora.</p>`,
  }),
  verify_email: (v) => ({
    subject: "Activa tu cuenta de Guía ZMG",
    html: `<h1>¡Casi listo${v.name ? `, ${v.name}` : ""}!</h1><p>Confirma tu correo para activar tu cuenta en Guía ZMG.</p><p><a href="${v.verifyUrl || "#"}" style="background:#059669;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Activar mi cuenta</a></p><p>El enlace expira en 24 horas. Si no creaste esta cuenta, ignora este correo.</p>`,
  }),
  // Se envía al correo NUEVO: el cambio solo se aplica al confirmar este enlace.
  verify_email_change: (v) => ({
    subject: "Confirma tu nuevo correo — Guía ZMG",
    html: `<h1>Confirma tu nuevo correo</h1><p>Se solicitó cambiar el correo de una cuenta de Guía ZMG a esta dirección. Para confirmarlo y activarlo, haz clic:</p><p><a href="${v.verifyUrl || "#"}" style="background:#059669;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Confirmar nuevo correo</a></p><p>El enlace expira en 24 horas. Si no fuiste tú, ignora este correo: la cuenta seguirá con su correo actual.</p>`,
  }),
  // Aviso de seguridad al correo ANTERIOR cuando alguien pide cambiarlo.
  email_change_alert: (v) => ({
    subject: "Se solicitó cambiar el correo de tu cuenta — Guía ZMG",
    html: `<h1>Solicitud de cambio de correo</h1><p>Se pidió cambiar el correo de tu cuenta de Guía ZMG a <strong>${v.newEmail || ""}</strong>. El cambio solo se aplica cuando se confirme desde ese correo nuevo.</p><p>Si <strong>no</strong> fuiste tú, cambia tu contraseña de inmediato y contáctanos: el cambio aún no se ha aplicado.</p>`,
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
