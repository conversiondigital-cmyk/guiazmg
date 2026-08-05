"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, MessageCircle, Globe, MapPin } from "@/lib/icons"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
// saltaba fechas (11/7, 21/7, 27/7…) y la barra se veía como un bloque suelto.
// Aquí se normaliza a los últimos 30 días CONTINUOS (rellenando ceros) para que
// el eje sea parejo y la gráfica lea como una línea de tiempo real.
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

// Totales por canal en el periodo — la lectura "de un vistazo" que faltaba.
const CONTACT_TOTALS = [
  { key: "phoneClicks", label: "Llamadas", color: "#f97316", icon: Phone },
  { key: "whatsappClicks", label: "WhatsApp", color: "#22c55e", icon: MessageCircle },
  { key: "websiteClicks", label: "Sitio web", color: "#8b5cf6", icon: Globe },
  { key: "mapClicks", label: "Ruta / Mapa", color: "#3b82f6", icon: MapPin },
] as const

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
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={tickInterval} tickFormatter={dayLabel} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={28} />
              <Tooltip labelFormatter={(v) => dayLabel(String(v))} />
              <Line type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} dot={false} name="Visitas" />
            </LineChart>
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
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={series} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={tickInterval} tickFormatter={dayLabel} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={28} />
                <Tooltip labelFormatter={(v) => dayLabel(String(v))} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Legend />
                <Bar dataKey="phoneClicks" fill="#f97316" name="Llamadas" stackId="a" />
                <Bar dataKey="whatsappClicks" fill="#22c55e" name="WhatsApp" stackId="a" />
                <Bar dataKey="websiteClicks" fill="#8b5cf6" name="Sitio web" stackId="a" />
                <Bar dataKey="mapClicks" fill="#3b82f6" name="Ruta" stackId="a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
