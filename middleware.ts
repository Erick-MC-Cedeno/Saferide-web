import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public routes that don't require authentication
const publicRoutes = ["/", "/auth/login", "/auth/register", "/about", "/contact", "/terms", "/privacy"]

// Define protected routes that require authentication
const protectedRoutes = ["/passenger/dashboard", "/driver/dashboard", "/profile", "/settings", "/history", "/payments"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // Check if the route is public
  const isPublicRoute = publicRoutes.includes(pathname)

  // Get authentication token from cookies
  const authToken = request.cookies.get("auth-token")?.value
  const userType = request.cookies.get("user-type")?.value

  // If it's a protected route and user is not authenticated
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and trying to access auth pages
  if (authToken && (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register"))) {
    // Redirect to appropriate dashboard based on user type
    const dashboardUrl = userType === "driver" ? "/driver/dashboard" : "/passenger/dashboard"
    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }

  // Check user type access for specific routes
  if (authToken && pathname.startsWith("/driver/") && userType !== "driver") {
    return NextResponse.redirect(new URL("/passenger/dashboard", request.url))
  }

  if (authToken && pathname.startsWith("/passenger/") && userType !== "passenger") {
    return NextResponse.redirect(new URL("/driver/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
