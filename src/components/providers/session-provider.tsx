"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // refetchOnWindowFocus por defecto es true en next-auth: cada foco/visibilitychange
  // vuelve a pegarle a /api/auth/session (JWT decode en el server). En un sitio
  // mayormente público eso genera una tormenta de peticiones y ralentiza. Se apaga;
  // la sesión se carga una vez al montar y solo se refresca al navegar.
  return (
    <NextAuthSessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
      {children}
    </NextAuthSessionProvider>
  )
}
