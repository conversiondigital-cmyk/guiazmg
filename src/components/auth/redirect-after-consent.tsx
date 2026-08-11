"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2 } from "@/lib/icons"

// Para un usuario que YA aceptó términos pero cuyo token todavía no trae la
// bandera (sesión previa a la función). Refresca el token (update() → acceptedTerms
// = true) y luego lo reenvía a su destino. Sin esto, el candado global lo mandaría
// una y otra vez a la bienvenida (loop) porque el token seguiría "sin aceptar".
export function RedirectAfterConsent({ next }: { next: string }) {
  const router = useRouter()
  const { update } = useSession()

  useEffect(() => {
    let done = false
    ;(async () => {
      try {
        await update()
      } catch {
        /* aunque falle, se intenta reenviar */
      }
      if (!done) router.replace(next)
    })()
    return () => {
      done = true
    }
  }, [update, next, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-green-700" />
    </div>
  )
}
