"use client"
import { usePathname } from "next/navigation"
import { Navbar } from "./Navbar"

export function ConditionalNavbar() {
  const pathname = usePathname()

  const isDashboardPage = pathname?.startsWith("/passenger/dashboard") || pathname?.startsWith("/driver/dashboard")

  if (isDashboardPage) {
    return null
  }

  return <Navbar />
}
