import { signIn } from "next-auth/react"
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

/**
 * DEBUG ONLY - Temporary endpoint to auto-login as admin
 * Should be removed in production
 */
export async function GET(request: NextRequest) {
  // Only allow from localhost in development
  const headersList = await headers()
  const host = headersList.get("host") || ""

  if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    )
  }

  // Redirect to signin with admin credentials in development
  return NextResponse.json({
    message: "Use credentials: baeltaezaer@gmail.com / admin123",
    next_step: "Go to http://localhost:3100/auth/login",
  })
}
