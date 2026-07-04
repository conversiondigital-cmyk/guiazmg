"use client"

import Link from "next/link"
import { useState } from "react"
import { MapPin, MessageCircle, Share2, Tv, ChevronDown } from "lucide-react"

// Alias para redes sociales usando íconos genéricos disponibles en lucide-react v0.x
const Facebook = Share2
const Instagram = Share2
const Youtube = Tv

const NAV = [
  { label: "Inicio", href: "/" },
  { label: "Categorías", href: "/search" },
  { label: "Promociones", href: "/promociones" },
  { label: "Blog", href: "/blog" },
  { label: "Contacto", href: "/contacto" },
]

const FOR_BUSINESS = [
  { label: "Agregar negocio", href: "/registrar-negocio" },
  { label: "Planes y precios", href: "/planes" },
  { label: "Beneficios", href: "/planes" },
  { label: "Guía para negocios", href: "/blog" },
  { label: "Centro de ayuda", href: "/preguntas" },
]

const SUPPORT = [
  { label: "Ayuda", href: "/preguntas" },
  { label: "Términos y condiciones", href: "/terminos" },
  { label: "Política de privacidad", href: "/privacidad" },
  { label: "Aviso de privacidad", href: "/aviso-legal" },
  { label: "Contacto", href: "/contacto" },
]

// TODO: reemplazar con los handles/teléfono reales de Guía ZMG cuando estén definidos.
const SOCIALS = [
  { icon: Facebook,       href: "https://www.facebook.com/guiazmg",  label: "Facebook" },
  { icon: Instagram,      href: "https://www.instagram.com/guiazmg", label: "Instagram" },
  { icon: MessageCircle,  href: "https://wa.me/523300000000",        label: "WhatsApp" },
  { icon: Youtube,        href: "https://www.youtube.com/@guiazmg",  label: "YouTube" },
]

// Grupo de enlaces del footer. En móvil es un acordeón (colapsado por defecto, para
// que el footer no sea una lista larga); en escritorio (lg) el botón no reacciona y la
// lista siempre se ve, comportándose como una columna normal del grid.
function FooterGroup({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/10 lg:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left lg:pointer-events-none lg:mb-4 lg:py-0"
      >
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</h4>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform lg:hidden ${open ? "rotate-180" : ""}`}
        />
      </button>
      <ul className={`space-y-2.5 pb-5 lg:block lg:pb-0 ${open ? "block" : "hidden"}`}>
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-gray-400 transition-colors hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle")

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus("loading")
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus("ok")
        setEmail("")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="lg:grid lg:grid-cols-5 lg:gap-10">

          {/* Brand */}
          <div className="mb-8 lg:col-span-1 lg:mb-0">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-700">
                <MapPin className="h-5 w-5 fill-white text-white" />
              </div>
              <span className="text-lg font-black text-white">Guía ZMG</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Conectamos personas con los mejores negocios, servicios y
              productos de la Zona Metropolitana de Guadalajara.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map((s) => {
                const Icon = s.icon
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-gray-400 hover:bg-green-700 hover:text-white transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Grupos de enlaces: en móvil son acordeones (evita la lista larga);
              en escritorio `lg:contents` los convierte en 3 columnas del grid. */}
          <div className="border-t border-white/10 lg:contents">
            <FooterGroup title="Navegación" links={NAV} />
            <FooterGroup title="Para negocios" links={FOR_BUSINESS} />
            <FooterGroup title="Soporte" links={SUPPORT} />
          </div>

          {/* Newsletter */}
          <div className="mt-8 lg:mt-0">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
              Suscríbete a nuestro boletín
            </h4>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Recibe promociones y noticias de negocios locales.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (status !== "idle") setStatus("idle")
                }}
                placeholder="Tu correo electrónico"
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-green-600 transition-colors"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-600 transition-colors disabled:opacity-60"
              >
                {status === "loading" ? "Enviando..." : "Suscribirme"}
              </button>
              {status === "ok" && (
                <p className="text-xs text-green-400">¡Listo! Te suscribiste correctamente.</p>
              )}
              {status === "error" && (
                <p className="text-xs text-red-400">No se pudo completar. Revisa tu correo e inténtalo de nuevo.</p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Guía ZMG. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
