"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2 } from "@/lib/icons"

// Caso RARO: el usuario YA aceptó términos (BD) pero su token trae la bandera en
// `false` EXPLÍCITO (firmó antes de consentir y el token no se refrescó). Un
// redirect directo haría bucle con el candado del proxy (=== false), así que aquí
// se refresca el token (update() → acceptedTerms=true) y luego se reenvía. Blindado
// para NO poder colgarse: corre una sola vez y el update() compite contra un tope de
// tiempo, tras el cual se redirige de todos modos (la revalidación del jwt lo sana).
export function RedirectAfterConsent({ next }: { next: string }) {
  const router = useRouter()
  const { update } = useSession()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    ;(async () => {
      try {
        await Promise.race([
          update(),
          new Promise((resolve) => setTimeout(resolve, 4000)),
        ])
      } catch {
        /* aunque falle, se reenvía */
      }
      router.replace(next)
    })()
  }, [update, next, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-green-700" />
    </div>
  )
}
