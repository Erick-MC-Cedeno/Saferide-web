import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Navbar } from "@/components/Navbar"
import { ErrorBoundary } from "@/components/ErrorBoundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SafeRide - Transporte Seguro y Confiable",
  description: "La plataforma de transporte más segura. Viajes seguros, conductores verificados, disponible 24/7.",
  keywords: "transporte, taxi, uber, seguro, conductores verificados, viajes",
  authors: [{ name: "SafeRide Team" }],
  openGraph: {
    title: "SafeRide - Transporte Seguro y Confiable",
    description: "La plataforma de transporte más segura. Viajes seguros, conductores verificados, disponible 24/7.",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
