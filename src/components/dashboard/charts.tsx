"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  return (
    <div className="space-y-6">
      {/* Visits / Leads chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visitas diarias</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => {
                  const d = new Date(v)
                  return `${d.getDate()}/${d.getMonth() + 1}`
                }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                name="Visitas"
              />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={false}
                name="Leads"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Clicks breakdown chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contactos diarios</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => {
                  const d = new Date(v)
                  return `${d.getDate()}/${d.getMonth() + 1}`
                }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="whatsappClicks" fill="#25D366" name="WhatsApp" stackId="a" />
              <Bar dataKey="phoneClicks" fill="#f97316" name="Llamadas" stackId="a" />
              <Bar dataKey="websiteClicks" fill="#8b5cf6" name="Sitio Web" stackId="a" />
              <Bar dataKey="mapClicks" fill="#ef4444" name="Ruta" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
