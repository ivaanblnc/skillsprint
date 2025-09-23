import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Interceptar URLs que contengan parámetros de error de Supabase PERO NO si ya van a /auth/callback
  if (request.nextUrl.pathname !== "/auth/callback" && 
      request.nextUrl.searchParams.has("error") && 
      request.nextUrl.searchParams.has("error_code") && 
      request.nextUrl.searchParams.get("error") === "access_denied") {
    
    console.log("Supabase error detected in URL, redirecting to callback")
    const callbackUrl = new URL("/auth/callback", request.nextUrl.origin)
    
    // Copiar todos los parámetros de la URL original
    request.nextUrl.searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value)
    })
    
    return NextResponse.redirect(callbackUrl)
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const publicPaths = ["/", "/auth/login", "/auth/register", "/auth/verify-email", "/auth/callback", "/auth/sign-up-success", "/api/auth"]
  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Supabase environment variables not found, allowing public access")
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && !isPublicPath) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    return response
  } catch (error) {
    console.error("[v0] Middleware error:", error)
    return response
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
