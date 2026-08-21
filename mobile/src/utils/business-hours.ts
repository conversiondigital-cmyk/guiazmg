/**
 * Estado de horario "en vivo" a partir de `BusinessHour[]` (ver `api/types.ts`).
 * Se calcula en el cliente con la hora local del teléfono — el backend solo
 * manda la tabla de horarios, no un booleano ya resuelto, porque "abierto
 * ahora" depende del instante exacto en que se pinta la pantalla.
 */
import type { BusinessHour } from '@/api/types';

export type OpenStatus = {
  isOpen: boolean;
  /** "Abierto · cierra 8:00 PM" o "Cerrado · abre mañana 9:00 AM". `null` si no hay datos de horario. */
  label: string | null;
};

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function minutesSinceMidnight(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** `hours` puede venir vacío/undefined (negocio sin horario cargado): entonces no hay veredicto, no se inventa uno. */
export function computeOpenStatus(hours: BusinessHour[] | undefined, now: Date = new Date()): OpenStatus {
  if (!hours || hours.length === 0) {
    return { isOpen: false, label: null };
  }

  const dayOfWeek = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const today = hours.find((h) => h.dayOfWeek === dayOfWeek);

  if (today && !today.isClosed && today.opensAt && today.closesAt) {
    const opens = minutesSinceMidnight(today.opensAt);
    let closes = minutesSinceMidnight(today.closesAt);
    // Cierra después de medianoche (p.ej. 18:00 -> 01:00): el rango cruza el día.
    if (closes <= opens) closes += 24 * 60;
    const nowAdjusted = nowMinutes < opens && closes > 24 * 60 ? nowMinutes + 24 * 60 : nowMinutes;

    if (nowAdjusted >= opens && nowAdjusted < closes) {
      return { isOpen: true, label: `Abierto · cierra ${to12h(today.closesAt)}` };
    }
  }

  // Busca la próxima apertura, empezando por hoy (más tarde) y hasta 7 días adelante.
  for (let offset = 0; offset <= 7; offset += 1) {
    const dayIndex = (dayOfWeek + offset) % 7;
    const day = hours.find((h) => h.dayOfWeek === dayIndex);
    if (!day || day.isClosed || !day.opensAt) continue;

    const opens = minutesSinceMidnight(day.opensAt);
    if (offset === 0 && opens <= nowMinutes) continue; // ya pasó la apertura de hoy

    const when = offset === 0 ? 'hoy' : offset === 1 ? 'mañana' : DAY_NAMES[dayIndex];
    return { isOpen: false, label: `Cerrado · abre ${when} ${to12h(day.opensAt)}` };
  }

  return { isOpen: false, label: 'Cerrado' };
}
