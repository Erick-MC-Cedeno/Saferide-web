import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Navbar } from "@/components/Navbar"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { PWARegister } from '@/components/PWARegister'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SafeRide",
  description: "La plataforma de transporte más segura. Viajes seguros, conductores verificados, disponible 24/7.",
  keywords: "transporte, taxi, uber, seguro, conductores verificados, viajes",
  authors: [{ name: "SafeRide Team" }],
  openGraph: {
    title: "SafeRide - Transporte Seguro y Confiable",
    description: "La plataforma de transporte más segura. Viajes seguros, conductores verificados, disponible 24/7.",
    type: "website",
  },
  generator: "saferide",
}

// Use the dedicated viewport export (Next.js expects a viewport export instead of placing it inside metadata)
export const viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1d58fc" />
        <link rel="apple-touch-icon" href="/placeholder-logo.png" />
      </head>
  <body suppressHydrationWarning className={inter.className}>
        <ErrorBoundary>
          <PWARegister />
            <PWAInstallPrompt />
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
           
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}