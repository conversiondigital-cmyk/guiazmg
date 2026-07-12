"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ADMIN_CONFIG_SECTIONS, SECRET_KEYS } from "@/lib/admin-config-fields"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

interface ConfigValue {
  [key: string]: string
}

export function ConfigurationSectionClient({
  section,
  initialValues,
  savedSecrets = [],
}: {
  section: string
  initialValues: ConfigValue
  // Claves de secretos que YA tienen un valor guardado (el valor nunca llega
  // al navegador; esto solo alimenta el placeholder "•••• guardado").
  savedSecrets?: string[]
}) {
  const config = ADMIN_CONFIG_SECTIONS[section as keyof typeof ADMIN_CONFIG_SECTIONS]
  const savedSecretSet = new Set(savedSecrets)

  // Hooks must run unconditionally and before any early return.
  const [values, setValues] = useState<ConfigValue>(initialValues)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  if (!config) return <div>Sección no válida</div>

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)
    try {
      // Un secreto con input vacío se OMITE: significa "conservar el actual",
      // no borrarlo. Así evitamos sobreescribir la key guardada con "".
      const fieldsToSave = config.fields.filter(
        (field) => !(SECRET_KEYS.has(field.key) && !(values[field.key] || "").trim())
      )

      const results = await Promise.all(
        fieldsToSave.map(async (field) => {
          try {
            const res = await fetch("/api/admin/settings", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                key: field.key,
                value: values[field.key] || "",
                section,
              }),
            })

            if (!res.ok) {
              const error = await res.json()
              console.error(`Error guardando ${field.key}:`, error)
            }

            return res.ok
          } catch (err) {
            console.error(`Error guardando ${field.key}:`, err)
            return false
          }
        })
      )

      const successCount = results.filter((r) => r).length
      const totalCount = results.length

      if (successCount === totalCount) {
        setMessage({ type: "success", text: `✅ Configuración guardada correctamente (${successCount}/${totalCount})` })
      } else if (successCount > 0) {
        setMessage({ type: "error", text: `⚠️ Se guardaron ${successCount}/${totalCount} campos. Revisa los logs.` })
      } else {
        setMessage({ type: "error", text: "❌ Error al guardar configuración" })
      }
    } catch (error) {
      console.error("Error general al guardar:", error)
      setMessage({ type: "error", text: "❌ Error al guardar configuración" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{config.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <div
            className={`flex gap-2 rounded-lg p-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-900"
                : "bg-red-50 text-red-900"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <div className="space-y-4">
          {config.fields.map((field) => (
            <div key={field.key}>
              <label className="text-sm font-medium text-slate-900">{field.label}</label>
              {field.description && (
                <p className="text-xs text-slate-500 mt-0.5">{field.description}</p>
              )}
              {field.type === "textarea" ? (
                <textarea
                  value={values[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={
                    savedSecretSet.has(field.key)
                      ? "•••••••••••• (guardado — escribe para reemplazar)"
                      : field.placeholder
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-300 focus:outline-none"
                />
              ) : field.type === "toggle" ? (
                (() => {
                  // Sin valor guardado, el toggle refleja el default del campo
                  // (p.ej. el sitemap arranca activo aunque no se haya tocado).
                  const raw = values[field.key]
                  const on =
                    raw === undefined || raw === ""
                      ? field.default === "true" || field.default === "1"
                      : raw === "true" || raw === "1"
                  return (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => handleChange(field.key, e.target.checked ? "true" : "false")}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-600">{on ? "Habilitado" : "Deshabilitado"}</span>
                    </div>
                  )
                })()
              ) : field.type === "select" && field.options ? (
                <select
                  value={values[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-300 focus:outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={values[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={
                    savedSecretSet.has(field.key)
                      ? "•••••••••••• (guardado — escribe para reemplazar)"
                      : field.placeholder
                  }
                  autoComplete={SECRET_KEYS.has(field.key) ? "new-password" : undefined}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-300 focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
