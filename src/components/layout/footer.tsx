"use client"

import Link from "next/link"
import { useState } from "react"
import { MapPin, ChevronDown } from "lucide-react"

// Íconos de marca en SVG (lucide quitó los de marca por temas de marca registrada).
// Antes Facebook e Instagram usaban el MISMO ícono genérico (Share2) y se veían
// idénticos; ahora cada red tiene su glifo. Monocromo con currentColor.
type IconProps = { className?: string }
function IconFacebook({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}
function IconInstagram({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}
function IconYoutube({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}
function IconWhatsapp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

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
  { icon: IconFacebook,  href: "https://www.facebook.com/guiazmg",  label: "Facebook" },
  { icon: IconInstagram, href: "https://www.instagram.com/guiazmg", label: "Instagram" },
  { icon: IconWhatsapp,  href: "https://wa.me/523300000000",        label: "WhatsApp" },
  { icon: IconYoutube,   href: "https://www.youtube.com/@guiazmg",  label: "YouTube" },
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
