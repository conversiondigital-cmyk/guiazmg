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
}

// Construye el transporte SMTP leyendo la config del admin (Admin → Configuración
// → Correo SMTP) con respaldo a variables de entorno. Devuelve null si no hay host
// configurado, en cuyo caso el envío se omite sin romper la petición.
async function getMailer(): Promise<{ transporter: nodemailer.Transporter; from: string } | null> {
  const host = await getSetting("smtp_host", "SMTP_HOST")
  if (!host) return null
  const [port, user, pass, from, secure] = await Promise.all([
    getSetting("smtp_port", "SMTP_PORT"),
    getSetting("smtp_username", "SMTP_USER"),
    getSetting("smtp_password", "SMTP_PASS"),
    getSetting("smtp_from_email", "SMTP_FROM"),
    getSettingBool("smtp_tls_enabled", "SMTP_SECURE"),
  ])
  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port || "587"),
    secure,
    auth: { user, pass },
  })
  return { transporter, from: from || DEFAULT_FROM }
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
      await mailer.transporter.sendMail({ from: mailer.from, to, subject, html })
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
