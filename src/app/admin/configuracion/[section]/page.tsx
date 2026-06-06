import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ConfigurationSectionClient } from "@/components/admin/configuration-section-client"
import { ADMIN_CONFIG_SECTIONS } from "@/lib/admin-config-fields"

export const dynamic = "force-dynamic"

export default async function AdminConfigSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const config = ADMIN_CONFIG_SECTIONS[section as keyof typeof ADMIN_CONFIG_SECTIONS]
  if (!config) notFound()

  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") notFound()

  // Load all settings for this section
  const settingKeys = config.fields.map((f) => f.key)
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: settingKeys } },
  })

  const initialValues: Record<string, string> = {}
  config.fields.forEach((field) => {
    const setting = settings.find((s) => s.key === field.key)
    initialValues[field.key] = setting?.value || ""
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin / Configuración / {config.title}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">{config.title}</h1>
        <p className="text-sm text-slate-500">{config.description}</p>
      </div>

      <ConfigurationSectionClient section={section} initialValues={initialValues} />
    </div>
  )
}
