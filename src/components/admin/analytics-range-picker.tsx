"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

// Selector de rango de fechas para el panel de analytics. Escribe ?range=N en la
// URL; la página (server component, force-dynamic) re-renderiza con esa ventana.
const OPTIONS = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
]

export function AnalyticsRangePicker({ current }: { current: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const go = (days: number) => {
    const p = new URLSearchParams(searchParams.toString())
    if (days === 30) p.delete("range")
    else p.set("range", String(days))
    const qs = p.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs shadow-sm">
      {OPTIONS.map((o) => (
        <button
          key={o.days}
          type="button"
          onClick={() => go(o.days)}
          aria-pressed={current === o.days}
          className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
            current === o.days
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
