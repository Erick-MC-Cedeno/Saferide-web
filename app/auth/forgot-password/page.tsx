"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
// Removed Card UI wrapper so the page doesn't render inside a boxed card
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const router = useRouter()

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isValidEmail(email)) {
      setError("Por favor ingresa un correo electrónico válido")
      return
    }

    setLoading(true)

    try {
      if (!supabase) {
        setError("El servicio no está disponible")
        setLoading(false)
        return
      }

      const origin = window.location.origin
      const redirectTo = `${origin}/auth/reset-password`

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (resetError) {
        console.error("Reset password error:", resetError)
        if (resetError.message.includes("Email not confirmed")) {
          setError("Este correo no ha sido confirmado. Por favor verifica tu bandeja de entrada.")
        } else if (resetError.message.includes("Email rate limit exceeded")) {
          setError("Demasiados intentos. Por favor espera unos minutos antes de intentar nuevamente.")
        } else if (resetError.message.includes("User not found")) {
          // Do not reveal whether user exists
          setSuccess(true)
        } else {
          setError(`Error al enviar el correo: ${resetError.message}`)
        }
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push("/auth/login")
        }, 5000)
      }
    } catch (err: any) {
      console.error("Unexpected error:", err)
      setError("Error inesperado. Por favor intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError("")
    setSuccess(false)
    await handleResetPassword({ preventDefault: () => {} } as React.FormEvent)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Image src="/saferide-icon.svg" alt="SafeRide" width={56} height={56} />
            <div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                SafeRide
              </span>
              <div className="text-sm text-gray-500">Transporte Seguro</div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">¿Olvidaste tu contraseña?</h1>
          <p className="text-gray-600">{success ? "¡Revisa tu correo!" : "Ingresa tu correo y te enviaremos un link de recuperación"}</p>
        </div>

        <div className="bg-transparent">
          <div className="px-4 py-6">
            <div className="text-center">
              {success ? (
                <div className="flex flex-col items-center space-y-2">
                  <Mail className="h-12 w-12 text-blue-600" />
                  <p className="text-base">Correo enviado exitosamente</p>
                </div>
              ) : (
                <p className="text-sm text-gray-700">No te preocupes, te ayudaremos a recuperar tu cuenta</p>
              )}
            </div>

            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  <div className="space-y-2">
                    <p className="font-semibold">¡Correo enviado!</p>
                    <p className="text-sm">Hemos enviado un link de recuperación a <strong>{email}</strong></p>
                    <p className="text-sm">Por favor revisa tu bandeja de entrada y spam.</p>
                    <p className="text-sm">El link expirará en 1 hora.</p>
                    <p className="text-xs text-green-600 mt-2">Serás redirigido al login en 5 segundos...</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {!success && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-11"
                      placeholder="tu@ejemplo.com"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando correo...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar link de recuperación
                    </>
                  )}
                </Button>
              </form>
            )}

            {success && (
              <div className="mt-6 space-y-4">
                <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleResend} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Reenviar correo
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Link href="/auth/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline inline-flex items-center">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al inicio de sesión
                  </Link>
                </div>
              </div>
            )}

            {!success && (
              <div className="mt-6 text-center">
                <Link href="/auth/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline inline-flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio de sesión
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {success ? "Si no recibes el correo en 5 minutos, verifica tu carpeta de spam" : "Ingresa el correo que usaste para registrarte"}
          </p>
        </div>
      </div>
    </div>
  )
}

