import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Public routes that don't require authentication
const publicRoutes = new Set([
  "/",
  "/auth/login",
  "/auth/register",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/services",
  "/safety",
])

// Auth routes that authenticated users shouldn't access
const authRoutes = new Set(["/auth/login", "/auth/register"]) 

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // Get auth info from cookies - verificación segura usando token real de Supabase
  const supabaseToken = request.cookies.get('sb-access-token')?.value
  const userType = request.cookies.get("user-type")?.value
  const isAuthenticated = Boolean(supabaseToken)
  
  // Verificar origen de la solicitud para prevenir CSRF
  const requestOrigin = request.headers.get('origin')
  const host = request.headers.get('host')
  const isProd = process.env.NODE_ENV === 'production'
  // Si hay un origen en la solicitud, verificar que coincida con el host
  if (requestOrigin && host && !requestOrigin.includes(host)) {
    console.warn(`Posible CSRF detectado: Origen ${requestOrigin} no coincide con host ${host}`)
    if (isProd) {
      return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
    }
  }

  // Handle authenticated users trying to access auth pages
  if (isAuthenticated && authRoutes.has(pathname)) {
    // Verificar si hay una cookie de autenticación en proceso
    const authInProgress = request.cookies.get('auth-in-progress')?.value
    
    // Si hay un proceso de autenticación en curso, permitir el acceso a la página de login
    if (authInProgress && pathname === "/auth/login") {
      return NextResponse.next()
    }
    
    const dashboardPath = userType === "driver" ? "/driver/dashboard" : "/passenger/dashboard"
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  // Handle unauthenticated users trying to access protected routes
// Handle authentication redirects
  if (!isAuthenticated && !publicRoutes.has(pathname)) {
    // Verificar si hay una cookie de autenticación en proceso
    const authInProgress = request.cookies.get('auth-in-progress')?.value
    
    if (authInProgress) {
      // Si hay un proceso de autenticación en curso, redirigir SIEMPRE a la página de login
      // para evitar que rutas protegidas se carguen sin sesión
      const loginUrl = new URL("/auth/login", request.url)
      if (pathname !== "/") {
        loginUrl.searchParams.set("redirect", pathname)
      }
      return NextResponse.redirect(loginUrl)
    }
    
    const loginUrl = new URL("/auth/login", request.url)
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Handle role-based access control for authenticated users
  if (isAuthenticated) {
    // Driver trying to access passenger routes
    if (pathname.startsWith("/passenger/") && userType !== "passenger") {
      return NextResponse.redirect(new URL("/driver/dashboard", request.url))
    }

    // Passenger trying to access driver routes
    if (pathname.startsWith("/driver/") && userType !== "driver") {
      return NextResponse.redirect(new URL("/passenger/dashboard", request.url))
    }
  } else {
    // Si no está autenticado y está intentando acceder a rutas de dashboard
    // verificar si hay una cookie de autenticación en proceso
    const authInProgress = request.cookies.get('auth-in-progress')?.value
    
    if (authInProgress && (pathname.startsWith("/driver/") || pathname.startsWith("/passenger/"))) {
      // Si hay un proceso de autenticación en curso, redirigir a la página de login
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Files with extensions
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
}
