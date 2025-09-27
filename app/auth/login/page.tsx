"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, Users, Eye, EyeOff, Loader2, AlertCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import { loginUser } from "@/lib/auth"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userType, setUserType] = useState<"passenger" | "driver">("passenger")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const router = useRouter()
    const { isSupabaseReady, user, userType: ctxUserType, loading: authLoading } = useAuth()

  const handleUserTypeChange = (value: string) => {
    setUserType(value as "passenger" | "driver")
  }



  // VERIFICA SI EL USUARIO ESTÁ AUTENTICADO Y REDIRIGE AL DASHBOARD CORRESPONDIENTE

  useEffect(() => {
    if (authLoading || isLoggingIn) return
    if (user && (ctxUserType === 'driver' || ctxUserType === 'passenger')) {
      const redirectPath = ctxUserType === 'driver' ? '/driver/dashboard' : '/passenger/dashboard'
      router.replace(redirectPath)
    }
  }, [authLoading, user, ctxUserType, router])

  // MANEJADOR DE LOGIN: VALIDA SERVICIOS, LLAMA A loginUser Y REDIRIGE AL USUARIO SEGÚN EL TIPO O PARÁMETRO 'redirect'
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isSupabaseReady) {
      setError("Los servicios de autenticación no están disponibles. Por favor, intenta más tarde.")
      return
    }

    setLoading(true)
    setIsLoggingIn(true)
    setError("")

    try {
      const result = await loginUser(email, password, userType)
      if (result.success) {
        // REDIRECCIÓN POST-LOGIN: LEER PARAMETRO 'redirect' Y NAVEGAR A LA RUTA CORRESPONDIENTE
        const urlParams = new URLSearchParams(window.location.search)
        const redirectParam = urlParams.get('redirect')
  
        const defaultPath = userType === "driver" ? "/driver/dashboard" : "/passenger/dashboard"
        const redirectPath = redirectParam || defaultPath
  
        console.log("Redirigiendo a:", redirectPath)
        router.replace(redirectPath)
      } else {
        setError(result.error || "Error al iniciar sesión")
      }
    } catch (error: unknown) {
      console.error("Login handler unexpected error:", error)
      setError("Error inesperado. Por favor intenta de nuevo.")
    } finally {
      setLoading(false)
      setIsLoggingIn(false)
    }
  }


  // ESTADO DE CARGA: MUESTRA PANTALLA DE INICIALIZACIÓN MIENTRAS SE VERIFICA AUTH
  if (authLoading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
  {/* ELEMENTOS ANIMADOS DE FONDO */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
  {/* ENCABEZADO: TITULO Y SUBTITULO */}
        
        

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-6 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">Login <Image src="/saferide-icon.svg" width={24} height={24} alt="SafeRide" className="inline ml-2" /></CardTitle>
            <Tabs value={userType} onValueChange={handleUserTypeChange}>
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
            {/* AVISO DE SEGURIDAD: TERMINOS Y POLITICA DE PRIVACIDAD */}
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
          </CardContent>
        </Card>
  
      </div>
    </div>
  )
}
