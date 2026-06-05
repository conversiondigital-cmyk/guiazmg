import * as PrismaClientMod from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { validateEnv } from "@/lib/env"

validateEnv()

const globalForPrisma = globalThis as unknown as { prisma: any | undefined }

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

function createPrismaClient(): any {
  const PrismaClientCtor = (PrismaClientMod as any).PrismaClient
  const client = new PrismaClientCtor({ adapter })

  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "business") return Reflect.get(target, "profile", receiver)
      if (prop === "businessImage") return Reflect.get(target, "profileImage", receiver)
      if (prop === "businessTag") return Reflect.get(target, "profileTag", receiver)
      if (prop === "businessHour") return Reflect.get(target, "profileHour", receiver)
      if (prop === "businessMembership") return Reflect.get(target, "profileMembership", receiver)
      if (prop === "businessClaimRequest") return Reflect.get(target, "profileClaimRequest", receiver)
      if (prop === "businessAnalyticsDaily") return Reflect.get(target, "profileAnalyticsDaily", receiver)
      if (prop === "businessBadge") return Reflect.get(target, "profileBadge", receiver)
      return Reflect.get(target, prop, receiver)
    },
  })
}

export const prisma: any = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
