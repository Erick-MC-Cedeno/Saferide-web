"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Car, Users } from "lucide-react"
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
        userType: userType as "passenger" | "driver"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">SafeRide</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Crear Cuenta</h1>
          <p className="text-gray-600">Únete a la comunidad SafeRide</p>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={userType} onValueChange={setUserType}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="passenger" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Pasajero</span>
                </TabsTrigger>
                <TabsTrigger value="driver" className="flex items-center space-x-2">
                  <Car className="h-4 w-4" />
                  <span>Conductor</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
                <span className="mr-2">⚠️</span>
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+52 55 1234 5678"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {userType === "driver" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">Número de Licencia</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      placeholder="ABC123456"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehiclePlate">Placa del Vehículo</Label>
                    <Input
                      id="vehiclePlate"
                      name="vehiclePlate"
                      placeholder="ABC-123"
                      value={formData.vehiclePlate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel">Modelo del Vehículo</Label>
                    <Input
                      id="vehicleModel"
                      name="vehicleModel"
                      placeholder="Toyota Corolla"
                      value={formData.vehicleModel}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleYear">Año del Vehículo</Label>
                    <Input
                      id="vehicleYear"
                      name="vehicleYear"
                      placeholder="2020"
                      value={formData.vehicleYear}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{" "}
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
