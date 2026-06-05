import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const checks: Record<string, string> = {}
  let status: "ok" | "degraded" | "error" = "ok"

  // App
  checks.app = "ok"

  // Database
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbMs = Date.now() - start
    checks.database = `ok (${dbMs}ms)`
    if (dbMs > 1000) {
      status = "degraded"
      checks.database += " [slow]"
    }
  } catch {
    checks.database = "error"
    status = "error"
  }

  // Auth
  try {
    const authSecret = process.env.AUTH_SECRET
    checks.auth = authSecret && authSecret.length >= 32 ? "ok" : "missing or too short"
    if (!authSecret || authSecret.length < 32) status = "degraded"
  } catch {
    checks.auth = "error"
    status = "error"
  }

  // Storage
  const storageType = process.env.STORAGE_PROVIDER || "local"
  checks.storage = storageType === "local" ? "ok (local)" : `ok (${storageType})`

  // Mercado Pago
  const mpConfigured = !!(process.env.MERCADO_PAGO_ACCESS_TOKEN && process.env.MERCADO_PAGO_PUBLIC_KEY)
  checks.mercadoPago = mpConfigured ? "configured" : "not configured"

  // SMTP
  const smtpConfigured = !!process.env.SMTP_HOST
  checks.smtp = smtpConfigured ? "configured" : "not configured"

  const httpStatus = status === "error" ? 503 : 200

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    },
    { status: httpStatus }
  )
}
