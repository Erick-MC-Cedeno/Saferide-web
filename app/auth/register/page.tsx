"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Car, Users, Sparkles, UserPlus, Loader2 } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    // Driver specific fields
    licenseNumber: "",
    vehiclePlate: "",
    vehicleModel: "",
    vehicleYear: "",
  })
  const [userType, setUserType] = useState("passenger")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Importar la función registerUser desde auth.ts
      const { registerUser } = await import("@/lib/auth")

      // Preparar los datos del usuario según el tipo
      const userData = {
        ...formData,
        userType: userType as "passenger" | "driver",
      }

      // Registrar el usuario
      const result = await registerUser(userData, formData.password)

      if (result.success) {
        // Redirigir al login después de un registro exitoso
        window.location.href = "/auth/login"
      } else {
        setError(result.error || "Error al registrar usuario")
      }
    } catch (error: any) {
      console.error("Error de registro:", error)
      setError("Error inesperado. Por favor intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl shadow-2xl">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="text-left">
              <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                SafeRide
              </span>
              <div className="text-sm text-gray-500 font-medium">Transporte Seguro</div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">¡Únete a SafeRide!</h1>
          <p className="text-gray-600 text-lg">Crea tu cuenta y comienza tu viaje seguro</p>
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
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 rounded-xl flex items-start animate-in slide-in-from-top-2 duration-300">
                <span className="mr-2 text-lg">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Nombre Completo
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 rounded-xl bg-white/50 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 rounded-xl bg-white/50 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+52 55 1234 5678"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 rounded-xl bg-white/50 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 rounded-xl bg-white/50 backdrop-blur-sm"
                />
              </div>

              {userType === "driver" && (
                <div className="space-y-5 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Información del Conductor</h3>
                    <p className="text-sm text-gray-600">Completa los datos de tu vehículo</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="licenseNumber" className="text-sm font-semibold text-gray-700">
                        Número de Licencia
                      </Label>
                      <Input
                        id="licenseNumber"
                        name="licenseNumber"
                        placeholder="ABC123456"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        required
                        className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 rounded-xl bg-white/50 backdrop-blur-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="vehiclePlate" className="text-sm font-semibold text-gray-700">
                        Placa del Vehículo
                      </Label>
                      <Input
                        id="vehiclePlate"
                        name="vehiclePlate"
                        placeholder="ABC-123"
                        value={formData.vehiclePlate}
                        onChange={handleInputChange}
                        required
                        className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 rounded-xl bg-white/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="vehicleModel" className="text-sm font-semibold text-gray-700">
                        Modelo del Vehículo
                      </Label>
                      <Input
                        id="vehicleModel"
                        name="vehicleModel"
                        placeholder="Toyota Corolla"
                        value={formData.vehicleModel}
                        onChange={handleInputChange}
                        required
                        className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 rounded-xl bg-white/50 backdrop-blur-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="vehicleYear" className="text-sm font-semibold text-gray-700">
                        Año del Vehículo
                      </Label>
                      <Input
                        id="vehicleYear"
                        name="vehicleYear"
                        placeholder="2020"
                        value={formData.vehicleYear}
                        onChange={handleInputChange}
                        required
                        className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 rounded-xl bg-white/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] mt-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    <span>Crear Cuenta</span>
                    <Sparkles className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/auth/login"
                  className="text-purple-600 hover:text-pink-600 font-semibold hover:underline transition-all duration-300"
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            Al crear una cuenta, aceptas nuestros{" "}
            <Link href="/terms" className="text-purple-600 hover:text-pink-600 hover:underline transition-colors">
              Términos de Servicio
            </Link>{" "}
            y{" "}
            <Link href="/privacy" className="text-purple-600 hover:text-pink-600 hover:underline transition-colors">
              Política de Privacidad
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
