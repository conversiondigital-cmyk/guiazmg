// Envoltorio único de respuestas para /api/mobile/v1/*. Toda ruta del namespace
// móvil responde con esta forma, para que el cliente nativo pueda parsear con
// una sola lógica sin importar el endpoint: éxito siempre `{ ok:true, data }`,
// error siempre `{ ok:false, error:{ code, message, details? } }`.
import { NextResponse } from "next/server"
import type { MobileErrorCode } from "./errors"

// Metadatos de paginación opcionales que acompañan a `data` cuando el endpoint
// devuelve una colección. `nextCursor` es para paginación por cursor (feeds,
// listados que crecen); `page`/`total`/`hasMore` para paginación clásica offset.
export interface MobileMeta {
  page?: number
  limit?: number
  total?: number
  hasMore?: boolean
  nextCursor?: string | null
}

export interface MobileSuccessBody<T> {
  ok: true
  data: T
  meta?: MobileMeta
}

export interface MobileErrorBody {
  ok: false
  error: {
    code: MobileErrorCode
    message: string
    details?: unknown
  }
}

// Respuesta exitosa. `meta` se omite del cuerpo si no se provee (no manda
// `meta: undefined` en el JSON).
export function ok<T>(data: T, meta?: MobileMeta, init?: ResponseInit): NextResponse<MobileSuccessBody<T>> {
  const body: MobileSuccessBody<T> = meta !== undefined ? { ok: true, data, meta } : { ok: true, data }
  return NextResponse.json(body, init)
}

// Respuesta de error. `status` se recibe explícito (no se infiere), pero debe
// coincidir con `MOBILE_ERROR_HTTP_STATUS[code]` en `errors.ts` — esa tabla es
// la fuente única de verdad del mapeo código→HTTP; este parámetro solo evita
// que cada handler tenga que importar la tabla para leer un número.
export function fail(
  code: MobileErrorCode,
  status: number,
  message: string,
  details?: unknown
): NextResponse<MobileErrorBody> {
  const body: MobileErrorBody = details !== undefined ? { ok: false, error: { code, message, details } } : { ok: false, error: { code, message } }
  return NextResponse.json(body, { status })
}
