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

  // Get auth info from cookies
  const authToken = request.cookies.get("auth-token")?.value
  const userType = request.cookies.get("user-type")?.value
  const isAuthenticated = Boolean(authToken)

  // Handle authenticated users trying to access auth pages
  if (isAuthenticated && authRoutes.has(pathname)) {
    const dashboardPath = userType === "driver" ? "/driver/dashboard" : "/passenger/dashboard"
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  // Handle unauthenticated users trying to access protected routes
  if (!isAuthenticated && !publicRoutes.has(pathname)) {
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
