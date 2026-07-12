"use client"

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

export function ViewsChart({ data }: { data: { date: string; views: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function LeadsChart({ data }: { data: { date: string; leads: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="leads" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export type ContactsDatum = {
  date: string
  whatsapp: number
  phone: number
  website: number
  map: number
  social: number
}

// Series de contacto (canal → etiqueta/color). Se comparten con el desglose.
export const CONTACT_SERIES = [
  { key: "whatsapp", label: "WhatsApp", color: "#22c55e" },
  { key: "phone", label: "Llamadas", color: "#f97316" },
  { key: "website", label: "Sitio web", color: "#8b5cf6" },
  { key: "map", label: "Mapa / Ruta", color: "#ef4444" },
  { key: "social", label: "Redes", color: "#3b82f6" },
] as const

// Contactos por día, apilados por canal (WhatsApp, llamadas, sitio web, mapa, redes).
export function ContactsChart({ data }: { data: ContactsDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} interval="preserveStartEnd" minTickGap={16} />
        <YAxis fontSize={12} allowDecimals={false} />
        <Tooltip />
        <Legend />
        {CONTACT_SERIES.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} stackId="contacts" fill={s.color} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
