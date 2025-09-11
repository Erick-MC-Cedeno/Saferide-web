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
import { Shield, Car, Users, Eye, EyeOff, Loader2, AlertCircle, Wifi, WifiOff, Sparkles } from "lucide-react"
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
    const { isSupabaseReady } = useAuth()

  // Check if user is already logged in
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      // Redirect if already logged in
      const redirectPath = userType === "driver" ? "/driver/dashboard" : "/passenger/dashboard"
      router.push(redirectPath)
    }
  }, [user, authLoading, userType])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

      if (!isSupabaseReady) {
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
      <div className="min-h-screen flex items-center justify-center -mt-32">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <Sparkles className="h-8 w-8 text-purple-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-blue-600 mb-3">SafeRide</h2>
          <p className="text-lg text-gray-600 animate-pulse">Inicializando servicios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">¡Bienvenido de vuelta!</h1>
          <p className="text-gray-600 text-lg">Inicia sesión en tu cuenta de SafeRide</p>
        </div>

        

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-6 pb-6">
            <Tabs value={userType} onValueChange={setUserType}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 backdrop-blur-sm p-1 rounded-xl">
                <TabsTrigger
                  value="passenger"
                  className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
                >
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Pasajero</span>
                </TabsTrigger>
                <TabsTrigger
                  value="driver"
                  className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
                >
                  <Car className="h-4 w-4" />
                  <span className="font-medium">Conductor</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {error && (
              <Alert className="mb-6 border-red-200 bg-gradient-to-r from-red-50 to-pink-50 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 rounded-xl bg-white/50 backdrop-blur-sm"
                  disabled={loading || !isSupabaseReady}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 rounded-xl bg-white/50 backdrop-blur-sm"
                    disabled={loading || !isSupabaseReady}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-4 hover:bg-transparent transition-all duration-300"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || !isSupabaseReady}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all duration-300"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={loading || !isSupabaseReady}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <Sparkles className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                ¿No tienes cuenta?{" "}
                <Link
                  href="/auth/register"
                  className="text-blue-600 hover:text-purple-600 font-semibold hover:underline transition-all duration-300"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            Al iniciar sesión, aceptas nuestros{" "}
            <Link href="/terms" className="text-blue-600 hover:text-purple-600 hover:underline transition-colors">
              Términos de Servicio
            </Link>{" "}
            y{" "}
            <Link href="/privacy" className="text-blue-600 hover:text-purple-600 hover:underline transition-colors">
              Política de Privacidad
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
