export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { MessageCircle, Plus } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Mis solicitudes | Guía ZMG" }

export default async function SolicitudesPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = (session.user as any).id

  const solicitudes = await prisma.serviceRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      municipality: { select: { name: true } },
      _count: { select: { responses: true } },
    },
  })

  const STATUS_BADGE: Record<string, string> = {
    OPEN:      "bg-green-100 text-green-700",
    CLOSED:    "bg-gray-100  text-gray-500",
    FULFILLED: "bg-blue-100  text-blue-700",
  }
  const STATUS_LABEL: Record<string, string> = {
    OPEN: "Abierta", CLOSED: "Cerrada", FULFILLED: "Completada",
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-green-700" />
            Mis solicitudes
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{solicitudes.length} solicitudes</p>
        </div>
        <Link
          href="/solicitudes"
          className="flex items-center gap-2 rounded-xl bg-green-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-900 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva solicitud
        </Link>
      </div>

      {solicitudes.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-16 text-center">
          <MessageCircle className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">No tienes solicitudes activas</p>
          <p className="text-sm text-gray-400 mt-1">Crea una solicitud y recibe respuestas de negocios locales</p>
          <Link href="/solicitudes" className="mt-4 inline-flex rounded-xl bg-green-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-900 transition-colors">
            Crear solicitud
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((s) => (
            <div key={s.id} className="rounded-2xl bg-white border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 line-clamp-1">{s.title}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-400">
                    {s.category && <span>{s.category.name}</span>}
                    {s.municipality && <span>· {s.municipality.name}</span>}
                    <span>· {s._count.responses} respuestas</span>
                  </div>
                  {s.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{s.description}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STATUS_BADGE[(s as any).status] ?? "bg-gray-100 text-gray-500"}`}>
                  {STATUS_LABEL[(s as any).status] ?? (s as any).status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                {new Date(s.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
