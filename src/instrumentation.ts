import * as Sentry from "@sentry/nextjs"

// Monitoreo de errores server-side (RSC, rutas API, edge). Credential-ready:
// se activa SOLO si hay `SENTRY_DSN` en el entorno (Vercel). Sin DSN, Sentry
// no se inicializa y todo esto es un no-op — cero overhead.
export async function register() {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return

  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      // No enviar PII por defecto.
      sendDefaultPii: false,
    })
  }
}

// Captura los errores de render de Server Components y rutas (cuando hay DSN;
// si no, Sentry no está inicializado y esto no hace nada). `captureRequestError`
// existe en runtime pero falta en los tipos de esta versión → shim tipado.
type OnRequestError = (error: unknown, request: unknown, context: unknown) => void | Promise<void>
export const onRequestError: OnRequestError = (
  Sentry as unknown as { captureRequestError: OnRequestError }
).captureRequestError
