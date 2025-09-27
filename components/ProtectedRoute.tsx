"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import Image from "next/image"

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center mt-4">
          <div className="relative inline-block mb-8">
            <Image src="/saferide-icon.svg" alt="SafeRide" width={120} height={36} priority={true} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
          </div>
          <p className="text-lg text-gray-600 animate-pulse">Cargando...</p>
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

export default ProtectedRoute
