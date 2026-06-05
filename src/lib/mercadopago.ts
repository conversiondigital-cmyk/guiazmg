import MercadoPagoConfig, { Preference } from "mercadopago"
import type { PreferenceCreateData } from "mercadopago/dist/clients/preference/create/types"
import { getPublicAppUrl } from "@/lib/env"

function getClient(): MercadoPagoConfig {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN environment variable is not set")
  }
  return new MercadoPagoConfig({ accessToken })
}

function getPreferenceClient(): Preference {
  return new Preference(getClient())
}

export function buildPreferencePayload(params: {
  title: string
  quantity: number
  unitPrice: number
  externalReference: string
  coupon?: {
    code: string
    discountType: "PERCENTAGE" | "FIXED"
    discountValue: number
  }
}): PreferenceCreateData {
  let unitPrice = params.unitPrice

  if (params.coupon) {
    if (params.coupon.discountType === "PERCENTAGE") {
      unitPrice = unitPrice * (1 - params.coupon.discountValue / 100)
    } else {
      unitPrice = Math.max(0, unitPrice - params.coupon.discountValue)
    }
  }

  return {
    body: {
      items: [
        {
          id: params.externalReference,
          title: params.title,
          quantity: params.quantity,
          unit_price: unitPrice,
          currency_id: "MXN",
        },
      ],
      external_reference: params.externalReference,
      metadata: {
        couponCode: params.coupon?.code || null,
      },
      back_urls: {
        success: `${getPublicAppUrl()}/dashboard`,
        failure: `${getPublicAppUrl()}/planes`,
        pending: `${getPublicAppUrl()}/dashboard`,
      },
      auto_return: "approved",
      notification_url: `${getPublicAppUrl()}/api/payments/webhook`,
    },
  }
}

export async function createPreference(data: PreferenceCreateData) {
  const client = getPreferenceClient()
  return client.create(data)
}
