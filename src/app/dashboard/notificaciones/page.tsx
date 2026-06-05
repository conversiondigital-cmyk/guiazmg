export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { NotificationsList } from "./notifications-list"

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  })

  const serialized = JSON.parse(JSON.stringify(notifications))

  return <NotificationsList notifications={serialized} unreadCount={unreadCount} />
}
