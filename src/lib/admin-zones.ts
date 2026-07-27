// Coacciona el formData del CRUD genérico (todo llega como string) a los tipos
// reales de la zona. Compartido por /api/admin/zonas (POST) y [id] (PUT).
export function coerceZoneData(body: Record<string, unknown>) {
  const str = (v: unknown) => {
    const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v)
    return s === "" ? null : s
  }
  const bool = (v: unknown) => v === true || v === "true" || v === "Sí" || v === "1"
  // Requeridos: null/undefined → "" para que la validación de "obligatorio" los
  // atrape (String(null) daría "null", un valor truthy que se colaría).
  const req = (v: unknown) => (v == null ? "" : String(v).trim())
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = req(body.name)
  if (body.slug !== undefined) data.slug = req(body.slug)
  if (body.municipalityId !== undefined) data.municipalityId = req(body.municipalityId)
  if (body.description !== undefined) data.description = str(body.description)
  if (body.heroImageUrl !== undefined) data.heroImageUrl = str(body.heroImageUrl)
  if (body.seoTitle !== undefined) data.seoTitle = str(body.seoTitle)
  if (body.seoDescription !== undefined) data.seoDescription = str(body.seoDescription)
  if (body.priority !== undefined) data.priority = Number.parseInt(String(body.priority), 10) || 0
  if (body.isActive !== undefined) data.isActive = bool(body.isActive)
  if (body.isSeoIndexable !== undefined) data.isSeoIndexable = bool(body.isSeoIndexable)
  if (body.nearbyZoneSlugs !== undefined) {
    const raw = body.nearbyZoneSlugs
    data.nearbyZoneSlugs = Array.isArray(raw)
      ? raw.map((s) => String(s).trim()).filter(Boolean)
      : String(raw)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
  }
  return data
}
