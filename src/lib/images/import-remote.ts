import { uploadFile } from "@/lib/storage"

// Descarga una imagen desde una URL externa y la pasa por el pipeline de
// almacenamiento (uploadFile → convierte JPG/PNG/GIF a WebP con sharp y sube a R2).
// Devuelve la URL PROPIA (webp) ya hosteada, o null si algo falla — best-effort:
// nunca revienta el flujo que la llama. Pensado para:
//   (a) el admin "copia" la imagen de la fuente del evento (endpoint image-from-url),
//   (b) la ingesta RSS, para no depender de hotlinks externos que se rompen.

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const FETCH_TIMEOUT_MS = 12_000

// content-types de imagen que uploadFile entiende (jpg no estándar → jpeg).
const TYPE_MAP: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/gif": "image/gif",
  "image/webp": "image/webp",
}

// Defensa básica anti-SSRF: bloquea localhost / rangos privados. No es exhaustiva
// (no resuelve DNS), pero corta los casos obvios; además el endpoint exige ADMIN.
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "")
  if (h === "localhost" || h.endsWith(".localhost") || h === "0.0.0.0") return true
  if (/^(10\.|127\.|169\.254\.|192\.168\.)/.test(h)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true
  if (h === "::1" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true
  return false
}

export async function importRemoteImageToWebp(
  rawUrl: string,
  folder = "events",
): Promise<string | null> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return null
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null
  if (isBlockedHost(url.hostname)) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "GuiaZMG/1.0 (+image import)", Accept: "image/*" },
      redirect: "follow",
    })
    if (!res.ok) return null

    const ctRaw = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase()
    const contentType = TYPE_MAP[ctRaw]
    if (!contentType) return null // no es una imagen soportada

    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length === 0 || buf.length > MAX_BYTES) return null

    const ext = contentType.split("/")[1]
    const file = new File([buf], `remote-${Date.now()}.${ext}`, { type: contentType })

    const result = await uploadFile(file, {
      folder,
      allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      maxSizeBytes: MAX_BYTES,
      // convertToWebp por defecto: JPG/PNG/GIF salen .webp; si ya es webp se conserva.
    })
    return result.url
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
