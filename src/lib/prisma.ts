import * as PrismaClientMod from "@/generated/prisma/client"
import type { PrismaClient } from "@/generated/prisma/internal/class"
import { PrismaPg } from "@prisma/adapter-pg"
import { validateEnv } from "@/lib/env"

validateEnv()

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

// The generated `client.ts` carries `@ts-nocheck`, so its `PrismaClient` value
// export is not visible on the namespace type. Cast once here to obtain the
// constructor; the resulting instance is fully typed via the `PrismaClient`
// type imported above, which restores type-safety across the data layer
// (e.g. `prisma.profile` is now a compile error instead of silent `any`).
const PrismaClientCtor = (
  PrismaClientMod as unknown as {
    PrismaClient: new (options: { adapter: PrismaPg }) => PrismaClient
  }
).PrismaClient

function createPrismaClient(): PrismaClient {
  return new PrismaClientCtor({ adapter })
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
