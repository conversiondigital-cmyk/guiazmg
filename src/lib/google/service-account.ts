import crypto from "crypto"

// Autenticación de cuenta de servicio de Google SIN librería externa: firma un JWT
// RS256 y lo canjea por un access token para el scope pedido. Reutilizable por
// Search Console, GA4 Data API, etc. Devuelve null ante cualquier error.

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function getGoogleAccessToken(
  scope: string,
  clientEmail: string,
  privateKey: string,
): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000)
    const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    const claim = base64url(
      JSON.stringify({
        iss: clientEmail,
        scope,
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      }),
    )
    const signingInput = `${header}.${claim}`
    const signer = crypto.createSign("RSA-SHA256")
    signer.update(signingInput)
    const signature = base64url(signer.sign(privateKey))
    const assertion = `${signingInput}.${signature}`

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const j = await res.json()
    return j.access_token ?? null
  } catch {
    return null
  }
}
