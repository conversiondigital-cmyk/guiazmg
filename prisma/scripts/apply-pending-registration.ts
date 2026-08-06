// Idempotente: crea la tabla pending_registrations (alta de negocio en espera de
// pago). Respeta el DATABASE_URL del entorno (local o prod). NO usa db push.
import "dotenv/config"
import { prisma } from "../../src/lib/prisma"

async function main() {
  const db = prisma as unknown as { $executeRawUnsafe: (sql: string) => Promise<number> }
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "pending_registrations" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "planSlug" TEXT NOT NULL,
      "data" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
  await db.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "pending_registrations_userId_idx" ON "pending_registrations" ("userId");`,
  )
  console.log("OK: pending_registrations asegurada.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
