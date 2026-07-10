"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff, Store, MapPin, Star } from "@/lib/icons"

const HIGHLIGHTS = [
  { icon: Store, text: "Miles de negocios de Guadalajara y la ZMG" },
  { icon: MapPin, text: "Ubicación, horarios y contacto directo" },
  { icon: Star, text: "Reseñas y promociones para destacar" },
]

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [resending, setResending] = useState(false)

  // Mensajes de OAuth (?error=) y de activación de cuenta (?verified / ?verify_error).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("verified")) {
      setInfo("¡Cuenta activada! Ya puedes iniciar sesión.")
      return
    }
    if (params.get("verify_error")) {
      setError("El enlace de activación no es válido o ya expiró. Escribe tu correo abajo y reenvíalo.")
      return
    }
    const code = params.get("error")
    if (!code) return
    if (code === "OAuthAccountNotLinked") {
      setError("Ese correo ya está registrado con contraseña. Inicia sesión con tu correo y contraseña.")
    } else {
      setError("No se pudo iniciar sesión con Google. Inténtalo de nuevo o usa tu correo y contraseña.")
    }
  }, [])

  const handleResend = async () => {
    if (!email) {
      toast.error("Escribe tu correo para reenviar el enlace")
      return
    }
    setResending(true)
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      toast.success("Si tu cuenta necesita activación, te enviamos el enlace")
    } catch {
      toast.error("No se pudo reenviar. Inténtalo de nuevo.")
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      // Falla si no hubo respuesta, si trae error, o si ok === false.
      if (!result || result.error || result.ok === false) {
        setError("Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.")
        toast.error("Correo o contraseña incorrectos")
        return
      }

      // Redirige a cada rol a su panel (evita caer en /dashboard en blanco).
      const sess = await fetch("/api/auth/session").then((r) => r.json()).catch(() => null)
      const role = sess?.user?.role
      const dest =
        role === "ADMIN" ? "/admin" : role === "SALES_AGENT" ? "/agente" : role === "EDITOR" ? "/editor" : "/dashboard"
      router.push(dest)
    } catch {
      setError("No se pudo iniciar sesión. Inténtalo de nuevo.")
      toast.error("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Panel de marca — solo escritorio */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 p-12 lg:flex xl:p-16">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />

        <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-1 text-2xl font-bold text-white">
          <span className="rounded-lg bg-white/15 px-2 py-0.5 backdrop-blur-sm">Guía</span> ZMG
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
            Bienvenido de vuelta
          </h2>
          <p className="mt-4 text-green-50/90">
            Administra tu negocio, conecta con más clientes y destaca en el directorio local de Guadalajara.
          </p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-green-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <Icon className="h-4 w-4 text-white" />
                </span>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm text-green-100/70">
          Tu guía local de negocios · Guadalajara, Zapopan, Tlaquepaque, Tonalá
        </p>
      </aside>

      {/* Formulario */}
      <main className="flex w-full flex-col items-center justify-center bg-gray-50 px-4 py-10 sm:px-6 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Marca en móvil (el panel de la izquierda se oculta) */}
          <Link href="/" className="mb-8 flex items-center justify-center gap-1 text-2xl font-bold lg:hidden">
            <span className="text-green-700">Guía</span> ZMG
          </Link>

          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-gray-500">Accede a tu cuenta de Guía ZMG</p>
          </div>

          {info && (
            <div
              role="status"
              className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700"
            >
              {info}
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
            >
              {error}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="mt-1 block font-semibold text-red-800 underline underline-offset-2 hover:text-red-900 disabled:opacity-60"
              >
                {resending ? "Reenviando…" : "Reenviar enlace de activación"}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError("") }}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/auth/forgot-password" className="text-sm text-green-700 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError("") }}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 px-2 text-muted-foreground">o continúa con</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              try {
                await signIn("google", { callbackUrl: "/dashboard" })
              } catch {
                toast.error("No se pudo conectar con Google. Inténtalo de nuevo.")
              }
            }}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>

          <div className="mt-6 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/register" className="font-medium text-green-700 hover:underline">
              Registrarse
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
