import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  
  console.log("Supabase callback intercepted, redirecting to /auth/callback")
  
  // Construir la nueva URL con todos los parámetros
  const callbackUrl = new URL("/auth/callback", url.origin)
  url.searchParams.forEach((value, key) => {
    callbackUrl.searchParams.set(key, value)
  })
  
  return NextResponse.redirect(callbackUrl)
}
