"use client"

import Link from "next/link"
import { MapPin, MessageCircle, Share2, Tv } from "lucide-react"

// Alias para redes sociales usando íconos genéricos disponibles en lucide-react v0.x
const Facebook = Share2
const Instagram = Share2
const Youtube = Tv

const NAV = [
  { label: "Inicio", href: "/" },
  { label: "Categorías", href: "/search" },
  { label: "Promociones", href: "/search?tipo=promocion" },
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

const SOCIALS = [
  { icon: Facebook,       href: "#", label: "Facebook" },
  { icon: Instagram,      href: "#", label: "Instagram" },
  { icon: MessageCircle,  href: "#", label: "WhatsApp" },
  { icon: Youtube,        href: "#", label: "YouTube" },
]

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 lg:grid-cols-5">

          {/* Brand */}
          <div className="lg:col-span-1">
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
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-gray-400 hover:bg-green-700 hover:text-white transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Navegación */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
              Navegación
            </h4>
            <ul className="space-y-2.5">
              {NAV.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Para negocios */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
              Para negocios
            </h4>
            <ul className="space-y-2.5">
              {FOR_BUSINESS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
              Soporte
            </h4>
            <ul className="space-y-2.5">
              {SUPPORT.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
              Suscríbete a nuestro boletín
            </h4>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Recibe promociones y noticias de negocios locales.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-green-600 transition-colors"
              />
              <button
                type="submit"
                className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-600 transition-colors"
              >
                Suscribirme
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Guía ZMG. Todos los derechos reservados.</p>
          <p>Hecho con ♥ en Guadalajara</p>
        </div>
      </div>
    </footer>
  )
}
