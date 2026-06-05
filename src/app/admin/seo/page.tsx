import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SeoClient } from "./seo-client"

export const dynamic = "force-dynamic"

export default async function AdminSeoPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const [landingPages, defaultMetaSettings, seoSettings] = await Promise.all([
    prisma.seoLandingPage.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.systemSetting.findMany({
      where: { key: { in: ["seo_default_title", "seo_default_description", "seo_default_keywords"] } },
    }),
    prisma.systemSetting.findMany({
      where: { key: { in: ["sitemap_url", "robots_txt"] } },
    }),
  ])

  const pages = JSON.parse(JSON.stringify(landingPages))
  const defaultMeta = JSON.parse(JSON.stringify(defaultMetaSettings))
  const seo = JSON.parse(JSON.stringify(seoSettings))

  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <SeoClient
        landingPages={pages}
        defaultMeta={defaultMeta}
        seoSettings={seo}
      />
    </Suspense>
  )
}
