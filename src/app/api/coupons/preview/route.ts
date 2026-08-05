import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPlanBySlug } from "@/lib/constants"
import { resolveCoupon, applyCoupon } from "@/lib/coupons"

// Previsualiza el descuento de un cupón para un plan ANTES de pagar. Requiere
// sesión (evita enumerar códigos). NO modifica nada (no incrementa el uso; eso
// ocurre solo al concretarse el pago, en el webhook). Devuelve 200 con ok:false
// si el cupón no aplica, para que el cliente lo muestre inline sin tratarlo como
// error de red.
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  }

  const { code, plan } = (await request.json().catch(() => ({}))) as {
    code?: string
    plan?: string
  }

  const planDef = getPlanBySlug(plan)
  if (!planDef) {
    return NextResponse.json({ ok: false, error: "Plan inválido" }, { status: 400 })
  }

  const resolution = await resolveCoupon(code, planDef.price)
  if (!resolution.ok) {
    return NextResponse.json({ ok: false, error: resolution.error })
  }

  const final = applyCoupon(planDef.price, resolution.coupon)
  return NextResponse.json({
    ok: true,
    original: planDef.price,
    final,
    coupon: resolution.coupon, // null si no se envió código
  })
}
