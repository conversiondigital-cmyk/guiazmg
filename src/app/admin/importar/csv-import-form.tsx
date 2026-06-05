"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Upload, Download, Check, AlertCircle, Loader2, FileSpreadsheet, FileJson } from "@/lib/icons"

export function CsvImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[]; totalErrors?: number } | null>(null)

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null)
    setResult(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!file) return
    setLoading(true)
    setResult(null)
    try {
      let dataToSend: File
      const ext = file.name.split(".").pop()?.toLowerCase()

      if (ext === "json") {
        const text = await file.text()
        const json = JSON.parse(text)
        const rows = Array.isArray(json) ? json : json.rows || json.data || []
        const csvHeader = "name,category,municipality,neighborhood,phone,whatsapp,email,website,address,latitude,longitude,description"
        const csvRows = rows.map((r: any) =>
          [r.name || r.nombre || "", r.category || r.categoria || "", r.municipality || r.municipio || "", r.neighborhood || r.colonia || "", r.phone || r.telefono || "", r.whatsapp || "", r.email || "", r.website || r.web || "", r.address || r.direccion || "", r.latitude || r.lat || "", r.longitude || r.lng || "", r.description || r.descripcion || ""].join(",")
        )
        dataToSend = new File([csvHeader + "\n" + csvRows.join("\n")], "converted.csv", { type: "text/csv" })
      } else if (ext === "xlsx") {
        toast.error("Los archivos Excel deben convertirse a CSV. Usa 'Guardar como CSV' en Excel.")
        return
      } else {
        dataToSend = file
      }

      const fd = new FormData()
      fd.append("file", dataToSend)
      const res = await fetch("/api/admin/import-csv", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setResult(data)
      toast.success(`${data.created} negocios importados`)
    } catch { toast.error("Error al importar") }
    finally { setLoading(false) }
  }, [file])

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-400 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">Selecciona un archivo CSV o JSON</p>
              <p className="text-xs text-gray-400 mt-1">CSV: name, category, municipality, phone, email, address | JSON: array de objetos</p>
              <input type="file" accept=".csv,.json" onChange={handleFile} className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {file.name.endsWith(".csv") ? <FileSpreadsheet className="h-4 w-4" /> : <FileJson className="h-4 w-4" />}
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
            <Button onClick={handleSubmit} disabled={!file || loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {loading ? "Importando..." : "Importar Negocios"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              {result.created > 0 ? <Check className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-yellow-500" />}
              <h3 className="font-semibold">Resultado</h3>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium text-green-600">{result.created}</span> negocios creados</p>
              <p><span className="font-medium text-yellow-600">{result.skipped}</span> filas omitidas</p>
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-red-600">{result.totalErrors} errores:</p>
                  <ul className="list-disc list-inside text-red-500 text-xs mt-1 max-h-40 overflow-y-auto">
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Formatos Soportados</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-blue-700">CSV</p>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto mt-1">
name,category,municipality,neighborhood,phone,whatsapp,email,website,address,latitude,longitude,description{'\n'}
Taller El Chaparral,talleres,Guadalajara,Chapalita,3312345678,3312345678,taller@mail.com,https://ejemplo.com,"Av. Chapalita 123",20.6597,-103.3496,Taller mecánico
              </pre>
            </div>
            <div>
              <p className="font-medium text-green-700">JSON</p>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto mt-1">
{`[
  { "name": "Taller El Chaparral", "category": "talleres", "phone": "3312345678" }
]`}
              </pre>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => {
            const csv = "name,category,municipality,neighborhood,phone,whatsapp,email,website,address,latitude,longitude,description\n"
            const blob = new Blob([csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url; a.download = "plantilla_importar.csv"; a.click()
            URL.revokeObjectURL(url)
          }}>
            <Download className="h-4 w-4 mr-2" /> Descargar Plantilla CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
