const requiredVars = [
  "DATABASE_URL",
  "AUTH_SECRET",
] as const

function getProductionPublicUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL
  if (!url) {
    throw new Error("NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_URL must be set in production.")
  }
  return url
}

function requireStorageEnv() {
  const provider = process.env.STORAGE_PROVIDER

  if (!provider || provider === "local") {
    throw new Error(
      "STORAGE_PROVIDER must be set to s3, r2 or supabase in production."
    )
  }

  if (provider === "supabase") {
    const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET"].filter(
      (key) => !process.env[key]
    )

    if (missing.length > 0) {
      throw new Error(`Missing Supabase storage env vars:\n  ${missing.join("\n  ")}`)
    }
    return
  }

  const missing = ["S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_BUCKET", "S3_PUBLIC_URL"].filter(
    (key) => !process.env[key]
  )

  if (missing.length > 0) {
    throw new Error(`Missing S3/R2 storage env vars:\n  ${missing.join("\n  ")}`)
  }
}

function requireProductionRuntimeEnv() {
  getProductionPublicUrl()

  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL must be set in production.")
  }

  if (!process.env.SMTP_HOST) {
    throw new Error("SMTP_HOST must be set in production.")
  }
}

export function validateEnv() {
  if (typeof window !== "undefined") return

  const missing: string[] = []
  for (const key of requiredVars) {
    if (!process.env[key]) missing.push(key)
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}\n\n` +
        "Check .env.example for reference."
    )
  }

  if (!process.env.CSRF_SECRET) {
    process.env.CSRF_SECRET = process.env.AUTH_SECRET
  }

  if (process.env.NODE_ENV === "production") {
    requireStorageEnv()
    requireProductionRuntimeEnv()
  }
}

export function getPublicAppUrl(): string {
  if (process.env.NODE_ENV === "production") {
    return getProductionPublicUrl()
  }

  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || "http://localhost:3100"
}
