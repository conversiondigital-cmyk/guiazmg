"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { confirmDialog } from "@/components/ui/system-dialog"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [privacyLoading, setPrivacyLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Profile update would go here
    setTimeout(() => {
      toast.success("Configuración actualizada")
      setLoading(false)
    }, 1000)
  }

  const exportData = async () => {
    setPrivacyLoading(true)
    try {
      const res = await fetch("/api/user/export-data")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al exportar")
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "guiazmg-export.json"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Datos exportados")
    } catch (error: any) {
      toast.error(error.message || "Error al exportar")
    } finally {
      setPrivacyLoading(false)
    }
  }

  const deleteAccount = async () => {
    if (!(await confirmDialog({
      title: "Eliminar cuenta",
      description: "¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.",
      confirmText: "Eliminar cuenta",
      destructive: true,
    }))) return
    setPrivacyLoading(true)
    try {
      const res = await fetch("/api/user/delete-account", { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al eliminar")
      toast.success("Cuenta desactivada")
      await signOut({ callbackUrl: "/" })
      router.push("/")
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar")
    } finally {
      setPrivacyLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración de cuenta</h1>
        <p className="text-gray-500">Administra tu perfil y preferencias</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="3312345678" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacidad y cuenta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportData} disabled={privacyLoading}>
            Exportar mis datos
          </Button>
          <Button variant="destructive" onClick={deleteAccount} disabled={privacyLoading}>
            Eliminar cuenta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
