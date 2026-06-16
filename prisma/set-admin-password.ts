import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Actualiza (o crea) la contraseña de un usuario admin.
// La contraseña NUNCA se escribe aquí: se toma de la variable de entorno
// ADMIN_PASSWORD (y opcionalmente ADMIN_EMAIL). Uso:
//   1) En .env:  ADMIN_PASSWORD="tu-password-segura"
//   2) npm run db:set-admin-password
async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@guiazmg.com").toLowerCase().trim()
  const password = process.env.ADMIN_PASSWORD

  if (!password || password.length < 8) {
    throw new Error("Define ADMIN_PASSWORD (mínimo 8 caracteres) en el entorno antes de correr este script.")
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      isActive: true,
      // Invalida cualquier sesión activa previa al cambiar la contraseña.
      sessionVersion: { increment: 1 },
    },
    create: {
      email,
      name: "Administrador",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  })

  console.log(`✅ Contraseña de admin actualizada para ${user.email} (role: ${user.role}).`)
  console.log("   Las sesiones anteriores quedaron invalidadas.")
}

main()
  .catch((e) => {
    console.error("ERROR:", e instanceof Error ? e.message : e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
