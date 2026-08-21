/**
 * Ata la copia a la realidad.
 *
 * `src/lib/api/mobile/proxy-allowlist.ts` replica a mano los arrays de
 * `src/proxy.ts` para poder testear el matcher sin tocar el proxy más allá de
 * la única línea permitida. Pero un test contra una copia prueba la copia, no
 * el sistema: si alguien edita el array del proxy y no actualiza la copia, los
 * otros tests siguen verdes mientras el comportamiento real ya cambió.
 *
 * Estos tests leen el CÓDIGO FUENTE de `src/proxy.ts` y comparan los arrays
 * literales contra la copia. Así, desincronizarlos deja de ser silencioso: se
 * pone rojo.
 *
 * Comprobado que muerde: al escribirlos, quitar "/api/mobile" de la copia
 * (o del proxy) hace fallar `publicPrefixPaths coincide con el proxy real`.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { privatePrefixes, publicPrefixPaths } from "@/lib/api/mobile/proxy-allowlist"

const proxySource = readFileSync(join(process.cwd(), "src/proxy.ts"), "utf8")

/**
 * Extrae del fuente del proxy el array literal declarado como
 * `const <nombre> = [ ... ]` y devuelve las cadenas entrecomilladas que
 * contiene, en orden.
 */
function extractStringArray(source: string, name: string): string[] {
  const start = source.indexOf(`const ${name} = [`)
  if (start === -1) {
    throw new Error(
      `No se encontró 'const ${name} = [' en src/proxy.ts. ` +
        `Si lo renombraste, actualiza este test y la copia en proxy-allowlist.ts.`
    )
  }
  const open = source.indexOf("[", start)
  const close = source.indexOf("]", open)
  if (close === -1) throw new Error(`Array '${name}' sin cerrar en src/proxy.ts`)

  const body = source.slice(open + 1, close)
  return [...body.matchAll(/"([^"]*)"/g)].map((m) => m[1])
}

describe("la copia de la allowlist no puede desincronizarse del proxy real", () => {
  it("publicPrefixPaths coincide con el proxy real", () => {
    expect(extractStringArray(proxySource, "publicPrefixPaths")).toEqual(publicPrefixPaths)
  })

  it("privatePrefixes coincide con el proxy real", () => {
    expect(extractStringArray(proxySource, "privatePrefixes")).toEqual(privatePrefixes)
  })

  it("el proxy realmente exime al namespace móvil", () => {
    // El test de comportamiento vive en mobile-proxy-allowlist.test.ts y corre
    // sobre la copia. Este comprueba el hecho crudo en el archivo que se
    // despliega: si alguien revierte la línea, esto se pone rojo.
    expect(extractStringArray(proxySource, "publicPrefixPaths")).toContain("/api/mobile")
  })

  it("la expresión de matching del proxy sigue siendo la que replica la copia", () => {
    // Igualdad exacta o prefijo seguido de "/". Si el proxy cambiara a un
    // startsWith() pelado, "/api/mobileX" pasaría a colarse y la copia dejaría
    // de representar la realidad sin que ningún otro test lo note.
    expect(proxySource).toContain('pathname === p || pathname.startsWith(p + "/")')
  })
})
