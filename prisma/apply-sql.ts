/**
 * Ejecuta un archivo .sql contra la DATABASE_URL del entorno (soporta múltiples
 * sentencias y DO blocks, a diferencia de prisma db execute).
 *
 *   DATABASE_URL="<url>" npx tsx prisma/apply-sql.ts prisma/sql/2b-coupon-tables.sql
 *
 * dotenv NO sobrescribe una DATABASE_URL ya puesta en el shell, así que el valor que
 * exportes tiene prioridad sobre .env.
 */
import "dotenv/config"
import { readFileSync } from "node:fs"
import pg from "pg"

const file = process.argv[2]
if (!file) {
  console.error("uso: npx tsx prisma/apply-sql.ts <archivo.sql>")
  process.exit(1)
}
const url = process.env.DATABASE_URL
if (!url) {
  console.error("falta DATABASE_URL")
  process.exit(1)
}

const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  await client.query(readFileSync(file, "utf8"))
  console.log("OK:", file, "->", new URL(url).host)
} finally {
  await client.end()
}
