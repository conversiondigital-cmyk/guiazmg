import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    service: "guiazmg-public-api",
    version: "v1",
    timestamp: new Date().toISOString(),
  })
}
