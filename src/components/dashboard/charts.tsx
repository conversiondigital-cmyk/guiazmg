"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, MessageCircle, Globe, MapPin } from "@/lib/icons"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface ChartDataPoint {
  date: string
  views: number
  whatsappClicks: number
  phoneClicks: number
  websiteClicks: number
  mapClicks: number
  leads: number
}

interface DashboardChartsProps {
  data: ChartDataPoint[]
}

const EMPTY: Omit<ChartDataPoint, "date"> = {
  views: 0,
  whatsappClicks: 0,
  phoneClicks: 0,
  websiteClicks: 0,
  mapClicks: 0,
  leads: 0,
}

// La serie que llega solo trae los días CON registro (escasa), así que el eje X
// saltaba fechas y la barra se veía como un bloque suelto. Aquí se normaliza a los
// últimos 30 días CONTINUOS (rellenando ceros) para que el eje sea parejo.
function toContinuous(data: ChartDataPoint[]): ChartDataPoint[] {
  const byDate = new Map(data.map((d) => [d.date, d]))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const out: ChartDataPoint[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    out.push({ date: key, ...EMPTY, ...byDate.get(key) })
  }
  return out
}

const dayLabel = (v: string) => {
  const d = new Date(v)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

// Totales por canal en el periodo — la lectura "de un vistazo".
const CONTACT_TOTALS = [
  { key: "phoneClicks", label: "Llamadas", color: "#f97316", icon: Phone },
  { key: "whatsappClicks", label: "WhatsApp", color: "#16a34a", icon: MessageCircle },
  { key: "websiteClicks", label: "Sitio web", color: "#8b5cf6", icon: Globe },
  { key: "mapClicks", label: "Ruta / Mapa", color: "#3b82f6", icon: MapPin },
] as const

// Tooltip con tarjeta blanca, punto de color por serie y ocultando los ceros.
function ChartTooltip({ active, payload, label }: {
  active?: boolean
  label?: string | number
  payload?: Array<{ name?: string; value?: number; color?: string; fill?: string; dataKey?: string }>
}) {
  if (!active || !payload?.length) return null
  const rows = payload.filter((p) => (p.value ?? 0) > 0)
  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      <p className="mb-1 text-xs font-semibold text-gray-700">{dayLabel(String(label))}</p>
      {rows.length ? (
        rows.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
            <span className="text-gray-500">{p.name}</span>
            <span className="ml-auto font-semibold text-gray-900">{p.value}</span>
          </div>
        ))
      ) : (
        <p className="text-xs text-gray-400">Sin actividad</p>
      )}
    </div>
  )
}

const AXIS_TICK = { fontSize: 11, fill: "#9aa5b1" }

export function DashboardCharts({ data }: DashboardChartsProps) {
  if (!data.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-sm text-gray-400">
          No hay datos de los últimos 30 días
        </CardContent>
      </Card>
    )
  }

  const series = toContinuous(data)
  const totals = CONTACT_TOTALS.map((c) => ({
    ...c,
    value: data.reduce((s, r) => s + (r[c.key as keyof ChartDataPoint] as number), 0),
  }))
  const totalContacts = totals.reduce((s, c) => s + c.value, 0)
  // Con 30 puntos, mostrar ~6 etiquetas para que no se encimen.
  const tickInterval = Math.max(0, Math.floor(series.length / 6) - 1)

  return (
    <div className="space-y-6">
      {/* Visitas diarias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visitas diarias</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={series} margin={{ top: 6, right: 10, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#006c49" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#006c49" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#eef1f4" />
              <XAxis dataKey="date" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={tickInterval} tickFormatter={dayLabel} tickMargin={8} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="views" stroke="#006c49" strokeWidth={2.5} fill="url(#gViews)" name="Visitas" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Contactos diarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contactos diarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Totales por canal (lectura de un vistazo) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {totals.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.key} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Icon className="h-3.5 w-3.5" style={{ color: c.color }} />
                    {c.label}
                  </div>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{c.value}</p>
                </div>
              )
            })}
          </div>

          {totalContacts === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
              Aún no recibes contactos. Cuando alguien te llame, escriba por WhatsApp,
              visite tu sitio o pida la ruta, aparecerá aquí.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={series} barCategoryGap="30%" maxBarSize={26} margin={{ top: 6, right: 10, left: -14, bottom: 0 }}>
                  <defs>
                    {CONTACT_TOTALS.map((c) => (
                      <linearGradient key={c.key} id={`g-${c.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c.color} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={c.color} stopOpacity={0.65} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid vertical={false} stroke="#eef1f4" />
                  <XAxis dataKey="date" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={tickInterval} tickFormatter={dayLabel} tickMargin={8} />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.035)" }} />
                  <Bar dataKey="phoneClicks" stackId="a" fill="url(#g-phoneClicks)" name="Llamadas" />
                  <Bar dataKey="whatsappClicks" stackId="a" fill="url(#g-whatsappClicks)" name="WhatsApp" />
                  <Bar dataKey="websiteClicks" stackId="a" fill="url(#g-websiteClicks)" name="Sitio web" />
                  <Bar dataKey="mapClicks" stackId="a" fill="url(#g-mapClicks)" name="Ruta / Mapa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {/* Leyenda propia (colores consistentes con los totales de arriba) */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
                {CONTACT_TOTALS.map((c) => (
                  <div key={c.key} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />
                    {c.label}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
