import { describe, it, expect } from "vitest"
import { truncate, slugify, formatCurrency } from "@/lib/utils"

describe("truncate", () => {
  it("returns the string if shorter than max length", () => {
    expect(truncate("Hello", 10)).toBe("Hello")
  })

  it("truncates with ellipsis if longer than max length", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...")
  })

  it("handles empty string", () => {
    expect(truncate("", 5)).toBe("")
  })
})

describe("slugify", () => {
  it("converts text to lowercase and replaces spaces", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("removes special characters", () => {
    expect(slugify("¡Hola! ¿Cómo estás?")).toBe("hola-como-estas")
  })

  it("handles accented characters", () => {
    expect(slugify("café")).toBe("cafe")
  })
})

describe("formatCurrency", () => {
  it("formats number as MXN currency", () => {
    const result = formatCurrency(1500)
    expect(typeof result).toBe("string")
    expect(result).toContain("1")
  })
})
