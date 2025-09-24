"use client"
import { usePathname } from "next/navigation"
import { Navbar } from "./Navbar"

export function ConditionalNavbar() {
  const pathname = usePathname()

  const isDashboardPage =
    pathname?.startsWith("/passenger/dashboard") ||
    pathname?.startsWith("/driver/dashboard") ||
    pathname?.startsWith("/passenger/activity") ||
    pathname === "/settings" ||
    pathname === "/history" ||
    pathname === "/profile"

  if (isDashboardPage) {
    return null
  }

  return <Navbar />
}
