// SOLO LECTURA: reporta si Stripe está en test o live en prod, SIN exponer el
// secreto. Solo muestra el prefijo (sk_test_ / sk_live_ / whsec_) y enmascara el
// resto. No imprime la llave completa.
import "dotenv/config"
import { prisma } from "../../src/lib/prisma"

function classify(v: string | undefined | null): string {
  if (!v) return "VACÍO (no configurado)"
  const prefix = v.slice(0, 8)
  const masked = `${v.slice(0, 8)}…${v.slice(-4)} (len ${v.length})`
  let mode = "desconocido"
  if (v.startsWith("sk_live_") || v.startsWith("rk_live_")) mode = "LIVE ✅"
  else if (v.startsWith("sk_test_") || v.startsWith("rk_test_")) mode = "TEST ⚠️"
  else if (v.startsWith("whsec_")) mode = "(webhook secret)"
  return `${mode}  [${masked}]`
}

async function main() {
  const p = prisma as any
  const keys = ["stripe_api_key", "stripe_webhook_secret", "stripe_public_key", "stripe_sandbox"]
  const rows = await p.systemSetting.findMany({ where: { key: { in: keys } }, select: { key: true, value: true } })
  const map = new Map<string, string | null>(rows.map((r: any) => [r.key, r.value]))
  console.log("== Estado de Stripe en PROD ==")
  console.log("Secret Key      :", classify(map.get("stripe_api_key")))
  console.log("Webhook Secret  :", classify(map.get("stripe_webhook_secret")))
  console.log("Publishable Key :", classify(map.get("stripe_public_key")))
  console.log("Modo test flag  :", map.get("stripe_sandbox") ?? "(no seteado)")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
