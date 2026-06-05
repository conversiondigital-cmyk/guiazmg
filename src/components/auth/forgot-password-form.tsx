"use client"

import { useState } from "react"
import { Mail, Loader2, ArrowRight, Check } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error("Ingresa tu correo electrónico")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Error al enviar el enlace")
        return
      }
      setSent(true)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Correo enviado</h2>
        <p className="text-sm text-gray-500">
          Si existe una cuenta con {email}, recibirás un enlace para restablecer tu contraseña.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Correo electrónico</Label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="pl-10"
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <ArrowRight className="h-4 w-4 mr-2" />
        )}
        Enviar enlace
      </Button>
    </form>
  )
}
