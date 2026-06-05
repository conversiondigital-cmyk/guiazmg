const dsn = process.env.SENTRY_DSN
const enabled = !!dsn && process.env.NODE_ENV === "production"

export function initSentry() {
  if (!enabled) return
  try {
    require("@sentry/nextjs")
  } catch {}
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (!enabled) {
    console.error("[SENTRY_MOCK]", error.message, context || "")
    return
  }
  try {
    const Sentry = require("@sentry/nextjs")
    Sentry.captureException(error, { extra: context })
  } catch {
    console.error("[SENTRY_ERROR]", error.message)
  }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (!enabled) {
    console.log(`[SENTRY_MOCK] ${level.toUpperCase()}: ${message}`)
    return
  }
  try {
    const Sentry = require("@sentry/nextjs")
    Sentry.captureMessage(message, level)
  } catch {
    console.log(`[SENTRY_LOG] ${level.toUpperCase()}: ${message}`)
  }
}

export const sentry = { init: initSentry, captureError, captureMessage }
