import nodemailer from "nodemailer"
import { getPublicAppUrl } from "@/lib/env"

const FROM = process.env.SMTP_FROM || "noreply@guiazmg.com"
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
}

let _transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.mailtrap.io",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER || "", pass: process.env.SMTP_PASS || "" },
    })
  }
  return _transporter
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
    if (process.env.SMTP_HOST) {
      await getTransporter().sendMail({ from: FROM, to, subject, html })
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
