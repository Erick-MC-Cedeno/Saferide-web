"use client"
import { usePathname } from "next/navigation"
import { Navbar } from "./Navbar"

export function ConditionalNavbar() {
  const pathname = usePathname()

  // No mostrar navbar en páginas de dashboard y páginas de autenticación
  const hideNavbar =
    pathname?.startsWith("/passenger/dashboard") ||
    pathname?.startsWith("/driver/dashboard") ||
    pathname?.startsWith("/passenger/activity") ||
    pathname?.startsWith("/auth/") || // Ocultar en todas las páginas de autenticación
    pathname === "/settings" ||
    pathname === "/history" ||
    pathname === "/profile"

  if (hideNavbar) {
    return null
  }

  return <Navbar />
}
