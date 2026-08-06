// Uso LOCAL (dev): reestablece la contraseña del admin baeltaezaer@gmail.com al
// valor de ADMIN_PASSWORD (o "Navidad2027*!" por defecto). Idempotente: crea el
// admin si no existe, o solo actualiza su hash si ya existe. NO tocar en prod.
import "dotenv/config"
import bcrypt from "bcryptjs"
import { prisma } from "../../src/lib/prisma"

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "baeltaezaer@gmail.com"
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    throw new Error("Define ADMIN_PASSWORD en el entorno (no hay valor por defecto).")
  }
  const passwordHash = await bcrypt.hash(password, 12)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash, role: "ADMIN", isActive: true },
    })
    console.log(`Admin actualizado: ${email} (rol ADMIN, activo). Password = ${password}`)
  } else {
    await prisma.user.create({
      data: { name: "Administrador", email, passwordHash, role: "ADMIN", isActive: true },
    })
    console.log(`Admin creado: ${email}. Password = ${password}`)
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
