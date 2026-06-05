type AiProvider = "openai" | "claude" | "gemini" | "template"

interface AiOptions {
  provider?: AiProvider
  model?: string
  temperature?: number
  maxTokens?: number
}

const provider: AiProvider = (process.env.AI_PROVIDER as AiProvider) || "template"
const apiKey = process.env.AI_API_KEY || ""

function templates(text: string, type: string): string {
  const templates: Record<string, (t: string) => string> = {
    "business-description": (t) =>
      `Somos un negocio especializado en ${t.toLowerCase()}, ubicados en la Zona Metropolitana de Guadalajara. Ofrecemos servicios profesionales con calidad y confianza. Contáctanos para más información.`,
    "promotion": (t) =>
      `¡Aprovecha nuestra promoción especial! ${t}. Válido por tiempo limitado. No dejes pasar esta oportunidad.`,
    "marketplace-title": (t) =>
      `${t} - En venta en Guadalajara`,
    "marketplace-description": (t) =>
      `${t}. En excelentes condiciones. Entrega en la Zona Metropolitana de Guadalajara.`,
    "faq-answer": (t) =>
      `En Guía ZMG puedes encontrar información actualizada sobre ${t.toLowerCase()} en tu zona. Te recomendamos comparar opciones y leer reseñas de otros usuarios antes de elegir.`,
    "summary": (t) =>
      t.length > 200 ? t.slice(0, 197) + "..." : t,
    "spelling": (t) => t,
  }

  const fn = templates[type]
  if (!fn) return text
  return fn(text)
}

export async function aiGenerate(prompt: string, options: AiOptions = {}): Promise<string> {
  const useProvider = options.provider || provider

  if (useProvider === "template" || !apiKey) {
    const type = options.model || "business-description"
    return templates(prompt, type)
  }

  try {
    switch (useProvider) {
      case "openai": {
        const { default: OpenAI } = await import("openai")
        const client = new OpenAI({ apiKey })
        const res = await client.chat.completions.create({
          model: options.model || "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 300,
        })
        return res.choices[0]?.message?.content || prompt
      }
      case "claude": {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: options.model || "claude-3-haiku-20240307",
            max_tokens: options.maxTokens ?? 300,
            messages: [{ role: "user", content: prompt }],
          }),
        })
        const data = await res.json()
        return data.content?.[0]?.text || prompt
      }
      default:
        return templates(prompt, options.model || "business-description")
    }
  } catch {
    return templates(prompt, options.model || "business-description")
  }
}

export function generateBusinessDescription(keywords: string): Promise<string> {
  return aiGenerate(keywords, { model: "business-description" })
}

export function generatePromotion(text: string): Promise<string> {
  return aiGenerate(text, { model: "promotion" })
}

export function generateMarketplaceDescription(text: string): Promise<string> {
  return aiGenerate(text, { model: "marketplace-description" })
}

export function correctSpelling(text: string): Promise<string> {
  return aiGenerate(text, { model: "spelling" })
}

export const ai = {
  generate: aiGenerate,
  generateBusinessDescription,
  generatePromotion,
  generateMarketplaceDescription,
  correctSpelling,
}
