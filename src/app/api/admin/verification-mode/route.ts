import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getVerificationMode, setVerificationMode } from "@/lib/verification-config"

async function requireAdmin() {
  const session = await auth()
  return session?.user?.id && session.user.role === "ADMIN" ? session : null
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  return NextResponse.json({ mode: await getVerificationMode() })
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const mode = body?.mode === "manual" ? "manual" : "quick"
  return NextResponse.json({ mode: await setVerificationMode(mode) })
}
