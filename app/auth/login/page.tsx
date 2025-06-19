"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Car, Users, Eye, EyeOff, Loader2, AlertCircle, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"
import { loginUser } from "@/lib/auth"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userType, setUserType] = useState("passenger")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { isFirebaseReady } = useAuth()

  // Check if user is already logged in
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      // Redirect if already logged in
      const redirectPath = userType === "driver" ? "/driver/dashboard" : "/passenger/dashboard"
      window.location.href = redirectPath // Usar window.location.href para forzar un refresh completo
    }
  }, [user, authLoading, userType])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFirebaseReady) {
      setError("Los servicios de autenticación no están disponibles. Por favor, intenta más tarde.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await loginUser(email, password)

      if (result.success) {
        // Redirect and refresh the page after successful login
        const redirectPath = userType === "driver" ? "/driver/dashboard" : "/passenger/dashboard"
        window.location.href = redirectPath // Usar window.location.href para forzar un refresh completo
      } else {
        setError(result.error || "Error al iniciar sesión")
      }
    } catch (error: any) {
      setError("Error inesperado. Por favor intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Shield className="h-12 w-12 text-blue-600 mb-4" />
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">SafeRide</h2>
            <p className="text-gray-600 text-center">Inicializando servicios...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                SafeRide
              </span>
              <div className="text-sm text-gray-500">Transporte Seguro</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido de vuelta</h1>
          <p className="text-gray-600">Inicia sesión en tu cuenta de SafeRide</p>
        </div>

        {/* Firebase Status Indicator */}
        <div className="mb-4">
          <div
            className={`flex items-center justify-center space-x-2 p-2 rounded-lg ${
              isFirebaseReady ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
            }`}
          >
            {isFirebaseReady ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span className="text-sm">{isFirebaseReady ? "Servicios conectados" : "Conectando servicios..."}</span>
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-4">
            <Tabs value={userType} onValueChange={setUserType}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger value="passenger" className="flex items-center space-x-2 data-[state=active]:bg-white">
                  <Users className="h-4 w-4" />
                  <span>Pasajero</span>
                </TabsTrigger>
                <TabsTrigger value="driver" className="flex items-center space-x-2 data-[state=active]:bg-white">
                  <Car className="h-4 w-4" />
                  <span>Conductor</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  disabled={loading || !isFirebaseReady}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                    disabled={loading || !isFirebaseReady}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || !isFirebaseReady}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                disabled={loading || !isFirebaseReady}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{" "}
                <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Al iniciar sesión, aceptas nuestros{" "}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Términos de Servicio
            </Link>{" "}
            y{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Política de Privacidad
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
