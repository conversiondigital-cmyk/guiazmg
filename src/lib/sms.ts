import { getSetting } from "@/lib/settings"

// Envío de SMS credential-ready. Lee la config de Admin→Config→SMS (con respaldo
// a env). Si no hay proveedor/credenciales, hace no-op elegante (no rompe flujos).
// Proveedor implementado: Twilio (vía REST, sin SDK). nexmo/aws_sns quedan como
// punto de extensión.

export interface SmsResult {
  ok: boolean
  skipped?: boolean
  id?: string
  error?: string
}

export async function sendSms(to: string, message: string): Promise<SmsResult> {
  const provider = (await getSetting("sms_provider", "SMS_PROVIDER")).toLowerCase()
  if (!provider || provider === "none") {
    return { ok: true, skipped: true }
  }
  const from = await getSetting("sms_from_number", "SMS_FROM_NUMBER")
  try {
    switch (provider) {
      case "twilio":
        return await sendViaTwilio(to, message, from)
      case "nexmo":
      case "aws_sns":
        console.warn(`[SMS] proveedor "${provider}" aún no implementado`)
        return { ok: false, error: `Proveedor ${provider} no implementado todavía` }
      default:
        console.warn(`[SMS] proveedor desconocido: ${provider}`)
        return { ok: false, error: `Proveedor desconocido: ${provider}` }
    }
  } catch (e) {
    console.error("[SMS_ERROR]", e)
    return { ok: false, error: e instanceof Error ? e.message : "error desconocido" }
  }
}

async function sendViaTwilio(to: string, body: string, from: string): Promise<SmsResult> {
  const sid = await getSetting("sms_account_sid", "TWILIO_ACCOUNT_SID")
  const token = await getSetting("sms_api_key", "TWILIO_AUTH_TOKEN")
  if (!sid || !token || !from) {
    console.log("[SMS] Twilio sin credenciales completas → omitido")
    return { ok: true, skipped: true }
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  const params = new URLSearchParams({ To: to, From: from, Body: body })
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    return { ok: false, error: `Twilio ${res.status}: ${detail.slice(0, 200)}` }
  }
  const data = (await res.json().catch(() => ({}))) as { sid?: string }
  return { ok: true, id: data.sid }
}

// Helper para verificación de teléfono. Usa la plantilla de Admin→Config→SMS
// (con {code}) o un texto por defecto.
export async function sendVerificationSms(to: string, code: string): Promise<SmsResult> {
  const tpl = await getSetting("sms_template_verification")
  const message =
    tpl && tpl.includes("{code}")
      ? tpl.replace("{code}", code)
      : `Tu código de verificación de Guía ZMG es: ${code}`
  return sendSms(to, message)
}
