// Idempotente: agrega la columna notifications.link (TEXT, nullable) para que las
// notificaciones guarden su propio destino al hacer clic. Respeta el DATABASE_URL
// del entorno (local o prod). NO usa db push (prod tiene drift).
import "dotenv/config"
import { prisma } from "../../src/lib/prisma"

async function main() {
  const db = prisma as unknown as { $executeRawUnsafe: (sql: string) => Promise<number> }
  await db.$executeRawUnsafe(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "link" TEXT;`)
  console.log("OK: notifications.link asegurada.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
