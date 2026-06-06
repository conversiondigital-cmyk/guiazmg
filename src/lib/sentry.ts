const dsn = process.env.SENTRY_DSN
const enabled = !!dsn && process.env.NODE_ENV === "production"

export function initSentry() {
  if (!enabled) return
  try {
    require("@sentry/nextjs")
  } catch (error) {
    console.error("[SENTRY_INIT_ERROR]", error instanceof Error ? error.message : String(error))
  }
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (!enabled) {
    console.error("[SENTRY_MOCK]", error.message, context || "")
    return
  }
  try {
    const Sentry = require("@sentry/nextjs")
    Sentry.captureException(error, { extra: context })
  } catch (sentryError) {
    console.error("[SENTRY_CAPTURE_ERROR]", sentryError instanceof Error ? sentryError.message : String(sentryError), "Original error:", error.message)
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
  } catch (error) {
    console.error("[SENTRY_MESSAGE_ERROR]", error instanceof Error ? error.message : String(error), `Message: ${message}`)
  }
}

export const sentry = { init: initSentry, captureError, captureMessage }
