"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  // STATE MANAGEMENT
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  const updateInProgressRef = useRef(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  // CHECK FOR VALID SESSION ON MOUNT
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!supabase) {
          setError("El servicio no está disponible")
          setCheckingToken(false)
          return
        }

        // GET CURRENT SESSION - SUPABASE AUTOMATICALLY HANDLES THE TOKEN FROM URL
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          setError("Link de recuperación inválido o expirado")
          setValidToken(false)
        } else if (session) {
          // VALID SESSION EXISTS
          setValidToken(true)
        } else {
          setError("Link de recuperación inválido o expirado. Por favor solicita un nuevo link.")
          setValidToken(false)
        }
      } catch (error) {
        console.error("Error checking session:", error)
        setError("Error al verificar el link de recuperación")
        setValidToken(false)
      } finally {
        setCheckingToken(false)
      }
    }

    checkSession()
  }, [])

  // LISTENER: Escucha cambios de estado de auth para reflejar correctamente
  // el resultado de operaciones como updateUser (evita que quede el spinner)
  useEffect(() => {
    if (!supabase) return

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      try {
        // Eventos útiles: USER_UPDATED, PASSWORD_RECOVERY, SIGNED_OUT
        // Si recibimos USER_UPDATED o PASSWORD_RECOVERY, asumimos éxito
        if ((event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') && updateInProgressRef.current) {
          setLoading(false)
          setSuccess(true)
          setError('')
          return
        }

        // Si recibimos SIGNED_OUT y estábamos en loading, considerarlo como
        // finalización del flow (por seguridad muchas veces se hace signOut)
        if (event === 'SIGNED_OUT') {
          // No sobrescribimos un error existente en caso de fallo
          setLoading(false)
          if (!error && updateInProgressRef.current) setSuccess(true)
          return
        }

        // En cualquier otro caso, asegurarnos de que no quede el spinner
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setLoading(false)
        }
      } catch (e) {
        console.error('Error en listener de auth state change:', e)
        setLoading(false)
      }
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  // VALIDATE PASSWORD STRENGTH
  const validatePassword = (pass: string): string | null => {
    if (pass.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres"
    }
    if (!/[A-Z]/.test(pass)) {
      return "La contraseña debe contener al menos una letra mayúscula"
    }
    if (!/[a-z]/.test(pass)) {
      return "La contraseña debe contener al menos una letra minúscula"
    }
    if (!/[0-9]/.test(pass)) {
      return "La contraseña debe contener al menos un número"
    }
    return null
  }

  // HANDLE PASSWORD RESET
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // VALIDATE PASSWORDS MATCH
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    // VALIDATE PASSWORD STRENGTH
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

  // Mark that this component started an update flow so the auth listener
  // can distinguish initial session events from an actual password change.
  updateInProgressRef.current = true
  setLoading(true)

    try {
      if (!supabase) {
        setError("El servicio no está disponible")
        setLoading(false)
        return
      }

      // UPDATE USER PASSWORD USING SUPABASE
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        // HANDLE SUPABASE ERRORS
        console.error("Update password error:", updateError)
        setLoading(false)

        if (updateError.message.includes("session_not_found")) {
          setError("Sesión inválida o expirada. Por favor solicita un nuevo link de recuperación.")
        } else if (updateError.message.includes("same password")) {
          setError("La nueva contraseña debe ser diferente a la anterior")
        } else {
          setError(`Error al cambiar la contraseña: ${updateError.message}`)
        }
        return
      }

      // SUCCESS - PASSWORD UPDATED
  setLoading(false)
      setSuccess(true)

      // SIGN OUT USER AFTER PASSWORD CHANGE (OPTIONAL - IN BACKGROUND)
      // NO AWAIT TO PREVENT BLOCKING THE SUCCESS STATE
      supabase.auth.signOut().catch((err) => {
        console.error("Sign out error:", err)
      })

      // REDIRECT TO LOGIN AFTER 3 SECONDS
      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    } catch (error: any) {
      // HANDLE UNEXPECTED ERRORS
      console.error("Unexpected error:", error)
      setError("Error inesperado. Por favor intenta de nuevo.")
      setLoading(false)
    }
    finally {
      // Asegurar que el spinner no quede activo
      setLoading(false)
      // reset the update-in-progress flag after the attempt completes
      updateInProgressRef.current = false
    }
  }

  // LOADING STATE - CHECKING TOKEN
  if (checkingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="w-full max-w-md relative z-10">
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Image src="/saferide-icon.svg" alt="SafeRide" width={56} height={56} />
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">SafeRide</h2>
              <p className="text-gray-600 text-center">Verificando link de recuperación...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // INVALID TOKEN STATE
  if (!validToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Image src="/saferide-icon.svg" alt="SafeRide" width={56} height={56} />
              <div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">SafeRide</span>
                <div className="text-sm text-gray-500">Transporte Seguro</div>
              </div>
            </div>
          </div>

          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <div className="space-y-2">
                    <p className="font-semibold">Link inválido o expirado</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="mt-6 text-center">
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">Solicitar nuevo link de recuperación</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Image src="/saferide-icon.svg" alt="SafeRide" width={56} height={56} />
            <div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">SafeRide</span>
              <div className="text-sm text-gray-500">Transporte Seguro</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Restablecer contraseña</h1>
          <p className="text-gray-600">{success ? "¡Contraseña actualizada!" : "Ingresa tu nueva contraseña"}</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardDescription className="text-center">
              {success ? (
                <div className="flex flex-col items-center space-y-2">
                  <Lock className="h-12 w-12 text-green-600" />
                  <p className="text-base">Contraseña cambiada exitosamente</p>
                </div>
              ) : (
                "Tu nueva contraseña debe ser segura y diferente a la anterior"
              )}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  <div className="space-y-2">
                    <p className="font-semibold">¡Contraseña actualizada!</p>
                    <p className="text-sm">Tu contraseña ha sido cambiada exitosamente.</p>
                    <p className="text-sm">Ya puedes iniciar sesión con tu nueva contraseña.</p>
                    <p className="text-xs text-green-600 mt-2">Serás redirigido al login en 3 segundos...</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && !success && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {!success && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                      disabled={loading}
                      placeholder="Ingresa tu nueva contraseña"
                      autoFocus
                    />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Mínimo 6 caracteres, incluyendo mayúsculas, minúsculas y números</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                      disabled={loading}
                      placeholder="Confirma tu nueva contraseña"
                    />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cambiando contraseña...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Cambiar contraseña
                    </>
                  )}
                </Button>
              </form>
            )}

            {success && (
              <div className="mt-6 text-center">
                <Link href="/auth/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline inline-flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Ir al inicio de sesión ahora
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">{success ? "Tu sesión será cerrada por seguridad" : "Por seguridad, serás desconectado después de cambiar tu contraseña"}</p>
        </div>
      </div>
    </div>
  )
}