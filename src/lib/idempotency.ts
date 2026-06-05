import { prisma } from "@/lib/prisma"

export async function isDuplicate(key: string, windowMinutes = 5): Promise<boolean> {
  const existing = await prisma.idempotencyKey.findUnique({ where: { key } })
  if (existing) return true

  await prisma.idempotencyKey.create({
    data: {
      key,
      expiresAt: new Date(Date.now() + windowMinutes * 60 * 1000),
    },
  })
  return false
}

export async function clearExpiredKeys(): Promise<void> {
  await prisma.idempotencyKey.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
}
