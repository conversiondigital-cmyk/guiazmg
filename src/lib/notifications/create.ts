import { prisma } from "@/lib/prisma"

type NotificationKind =
  | "REVIEW"
  | "MESSAGE"
  | "PAYMENT"
  | "EXPIRATION"
  | "PROMOTION"
  | "SYSTEM"

/**
 * Crea una notificación en la base de datos (fire-and-forget).
 * Nunca lanza: un fallo al notificar no debe romper el flujo principal.
 */
export async function createNotification(input: {
  userId: string
  title: string
  message?: string | null
  type?: NotificationKind
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message ?? null,
        type: input.type ?? "SYSTEM",
        isRead: false,
      },
    })
  } catch (error) {
    console.error("[notifications] create failed:", error)
  }
}
