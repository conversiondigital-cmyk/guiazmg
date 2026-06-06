import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Delete existing admin and recreate
  const adminEmail = "baeltaezaer@gmail.com"
  
  await prisma.user.deleteMany({
    where: { email: adminEmail }
  })
  
  const passwordHash = await bcrypt.hash("admin123", 12)
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
  console.log("  Password: admin123")
  console.log("  Role:", admin.role)
  console.log("  Active:", admin.isActive)
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
