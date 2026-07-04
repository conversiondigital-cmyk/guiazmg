import Stripe from "stripe"
import { getSetting } from "@/lib/settings"

// Cliente de Stripe credential-ready: lee `stripe_api_key` de Admin→Config→Pagos
// (respaldo a env). Devuelve null si no hay clave → el llamador responde "no
// configurado" en vez de romper.
export async function getStripe(): Promise<Stripe | null> {
  const key = await getSetting("stripe_api_key", "STRIPE_SECRET_KEY")
  if (!key) return null
  return new Stripe(key)
}

export async function getStripeWebhookSecret(): Promise<string> {
  return getSetting("stripe_webhook_secret", "STRIPE_WEBHOOK_SECRET")
}
