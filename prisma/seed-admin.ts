import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { randomBytes } from "node:crypto"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Delete existing admin and recreate
  const adminEmail = process.env.ADMIN_EMAIL || "admin@guiazmg.com"

  await prisma.user.deleteMany({
    where: { email: adminEmail }
  })

  // Use ADMIN_PASSWORD from the environment; only fall back to a random,
  // one-off password for local/dev convenience. Never ship a fixed secret.
  const envPassword = process.env.ADMIN_PASSWORD
  const password = envPassword ?? randomBytes(12).toString("base64url")
  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.user.create({
    data: {
      name: "Administrador",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  })

  console.log("✅ Admin created:")
  console.log("  Email:", admin.email)
  console.log("  Role:", admin.role)
  if (envPassword) {
    console.log("  Password: (set via ADMIN_PASSWORD env var)")
  } else {
    console.log("  Password (random, dev only — set ADMIN_PASSWORD for a stable one):", password)
  }
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
