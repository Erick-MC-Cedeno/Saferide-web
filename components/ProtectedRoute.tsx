"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredUserType?: "passenger" | "driver"
}

export function ProtectedRoute({ children, requiredUserType }: ProtectedRouteProps) {
  const { user, userType, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
        return
      }

      if (requiredUserType && userType !== requiredUserType) {
        const redirectPath = userType === "driver" ? "/driver/dashboard" : "/passenger/dashboard"
        router.push(redirectPath)
        return
      }
    }
  }, [user, userType, loading, router, requiredUserType])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Shield className="h-12 w-12 text-blue-600 mb-4" />
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">SafeRide</h2>
            <p className="text-gray-600 text-center">Verificando autenticación...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  if (requiredUserType && userType !== requiredUserType) {
    return null // Will redirect to appropriate dashboard
  }

  return <>{children}</>
}
