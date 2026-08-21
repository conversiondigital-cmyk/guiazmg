import { describe, it, expect } from "vitest"
import { isPublicPrefixPath, requiresAuth } from "@/lib/api/mobile/proxy-allowlist"

// Tabla de casos que verifica la allowlist del proxy (`src/proxy.ts`) tras
// agregar "/api/mobile": en particular, que el namespace móvil pase, que NO
// se cuele por accidente ningún otro prefijo de `/api/`, y que el match de
// prefijo no sea "parcial" (p. ej. "/api/mobileX" no debe pasar solo porque
// empieza con las mismas letras que "/api/mobile").
describe("proxy allowlist — /api/mobile", () => {
  const cases: Array<{ pathname: string; expectedPublic: boolean; description: string }> = [
    { pathname: "/api/mobile/v1/health", expectedPublic: true, description: "health del namespace móvil" },
    { pathname: "/api/mobile/v1/config", expectedPublic: true, description: "config del namespace móvil" },
    { pathname: "/api/mobile", expectedPublic: true, description: "el prefijo exacto también es público" },
    { pathname: "/api/notifications", expectedPublic: false, description: "otra ruta /api/ NO debe colarse" },
    { pathname: "/api/public/v1/x", expectedPublic: true, description: "la API pública (no-móvil) sigue pasando" },
    { pathname: "/dashboard", expectedPublic: false, description: "ruta privada de la web sigue bloqueada" },
    {
      pathname: "/api/mobileX",
      expectedPublic: false,
      description: "el prefijo NO debe hacer match parcial indebido",
    },
    {
      pathname: "/api/mobileX/v1/health",
      expectedPublic: false,
      description: "tampoco con un sub-path detrás del prefijo mal formado",
    },
  ]

  for (const { pathname, expectedPublic, description } of cases) {
    it(`${pathname} → público=${expectedPublic} (${description})`, () => {
      expect(isPublicPrefixPath(pathname)).toBe(expectedPublic)
    })
  }
})

describe("proxy allowlist — requiresAuth (no debe cambiar para rutas privadas conocidas)", () => {
  it("/dashboard requiere auth", () => {
    expect(requiresAuth("/dashboard")).toBe(true)
  })

  it("/api/notifications requiere auth (no está en la allowlist pública)", () => {
    expect(requiresAuth("/api/notifications")).toBe(true)
  })

  it("/api/mobile/v1/health cae dentro de requiresAuth() por empezar con /api/, pero el proxy lo deja pasar ANTES por la allowlist", () => {
    // Nota: `requiresAuth` por sí sola diría `true` (todo /api/* lo hace),
    // pero en `src/proxy.ts` la allowlist se evalúa primero con un `return`
    // temprano, así que esta ruta nunca llega a evaluarse contra `requiresAuth`.
    expect(requiresAuth("/api/mobile/v1/health")).toBe(true)
    expect(isPublicPrefixPath("/api/mobile/v1/health")).toBe(true)
  })
})
