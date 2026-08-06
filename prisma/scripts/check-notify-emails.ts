// SOLO LECTURA: a qué correo llegan las notificaciones de admin y cuál es el
// remitente (FROM) configurado, para el flujo de "solicitar giro" y avisos.
import "dotenv/config"
import { prisma } from "../../src/lib/prisma"

async function main() {
  const p = prisma as any
  const admins = await p.user.findMany({
    where: { role: "ADMIN", isActive: true, deletedAt: null },
    select: { email: true, name: true },
  })
  console.log("== Admins que reciben avisos (destino) ==")
  for (const a of admins) console.log(`  ${a.email}  (${a.name})`)

  const keys = ["smtp_from_email", "smtp_host", "smtp_username"]
  const rows = await p.systemSetting.findMany({ where: { key: { in: keys } }, select: { key: true, value: true } })
  console.log("\n== Config de correo (remitente/SMTP) ==")
  for (const k of keys) {
    const v = rows.find((r: any) => r.key === k)?.value
    console.log(`  ${k}: ${v ?? "(vacío → usa noreply@guiazmg.com por defecto)"}`)
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
