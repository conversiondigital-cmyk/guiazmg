export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0=Sunday

export interface BusinessHourRow {
  dayOfWeek: number
  opensAt: string | null
  closesAt: string | null
  isClosed: boolean
}

export function formatHour(time: string | null): string {
  if (!time) return "—"
  const [h, m] = time.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour12 = h % 12 || 12
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export function getStatus(
  hours: BusinessHourRow[],
  now: Date = new Date()
): { open: boolean; message: string; nextOpen?: string } {
  if (!hours.length) return { open: false, message: "Horario no disponible" }

  const currentDay = now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const today = hours.find((h) => h.dayOfWeek === currentDay)
  if (today && !today.isClosed && today.opensAt && today.closesAt) {
    const [openH, openM] = today.opensAt.split(":").map(Number)
    const [closeH, closeM] = today.closesAt.split(":").map(Number)
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM

    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      const minsLeft = closeMinutes - currentMinutes
      if (minsLeft < 60) {
        return { open: true, message: `Cierra en ${minsLeft} min` }
      }
      return { open: true, message: `Abierto · Cierra a las ${formatHour(today.closesAt)}` }
    }

    if (currentMinutes < openMinutes) {
      return { open: false, message: `Abre hoy a las ${formatHour(today.opensAt)}` }
    }
  }

  for (let i = 1; i <= 7; i++) {
    const day = (currentDay + i) % 7
    const h = hours.find((h) => h.dayOfWeek === day)
    if (h && !h.isClosed && h.opensAt) {
      const dayName = i === 1 ? "Mañana" : DAY_NAMES[day]
      return {
        open: false,
        message: `Cerrado · Abre ${dayName} a las ${formatHour(h.opensAt)}`,
        nextOpen: `${DAY_NAMES[day]} ${formatHour(h.opensAt)}`,
      }
    }
  }

  return { open: false, message: "Cerrado" }
}

export function getHoursSummary(hours: BusinessHourRow[]): { today: string; full: string[] } {
  const currentDay = new Date().getDay()

  const today = hours.find((h) => h.dayOfWeek === currentDay)
  const todayStr = today
    ? today.isClosed
      ? "Hoy cerrado"
      : `Hoy: ${formatHour(today.opensAt)} - ${formatHour(today.closesAt)}`
    : "Hoy: Sin horario"

  const full = hours
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((h) => {
      if (h.isClosed) return `${DAY_NAMES[h.dayOfWeek]}: Cerrado`
      return `${DAY_NAMES[h.dayOfWeek]}: ${formatHour(h.opensAt)} - ${formatHour(h.closesAt)}`
    })

  return { today: todayStr, full }
}
