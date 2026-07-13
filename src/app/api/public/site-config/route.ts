export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getSetting } from "@/lib/settings"

// Config pública del sitio (contacto + redes) que el admin edita en
// Configuración → Contacto y redes. La consume el footer (componente cliente).
// Vacío = usar el valor por defecto en el cliente.
export async function GET() {
  const [facebook, instagram, tiktok, youtube, x, linkedin, whatsapp, email, phone, address] = await Promise.all([
    getSetting("social_facebook"),
    getSetting("social_instagram"),
    getSetting("social_tiktok"),
    getSetting("social_youtube"),
    getSetting("social_x"),
    getSetting("social_linkedin"),
    getSetting("contact_whatsapp"),
    getSetting("contact_email"),
    getSetting("contact_phone"),
    getSetting("contact_address"),
  ])

  return NextResponse.json(
    {
      socials: { facebook, instagram, tiktok, youtube, x, linkedin },
      contact: { whatsapp, email, phone, address },
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  )
}
