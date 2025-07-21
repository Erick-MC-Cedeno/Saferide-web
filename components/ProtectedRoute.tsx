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
      <div className="min-h-screen flex items-center justify-center -mt-32">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-blue-600 mb-3">SafeRide</h2>
          <p className="text-lg text-gray-600 animate-pulse">Verificando autenticación...</p>
        </div>
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
