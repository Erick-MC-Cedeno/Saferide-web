"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Car, Star, Users, Zap, Phone, Calendar, Package, Truck, Plane, Heart, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ServicesPage() {
  const mainServices = [
    {
      icon: Car,
      title: "SafeRide Estándar",
      description: "Viajes cómodos y seguros para el día a día",
      features: [
        "Vehículos verificados",
        "Conductores certificados",
        "Tarifas transparentes",
        "Seguimiento en tiempo real",
      ],
      price: "Desde C$50",
      color: "bg-blue-500",
    },
    {
      icon: Zap,
      title: "SafeRide Express",
      description: "Llegada rápida cuando tienes prisa",
      features: ["Tiempo de espera reducido", "Rutas optimizadas", "Prioridad en solicitudes", "Conductores cercanos"],
      price: "Desde C$75",
      color: "bg-orange-500",
    },
    {
      icon: Users,
      title: "SafeRide Compartido",
      description: "Comparte el viaje y ahorra dinero",
      features: ["Hasta 4 pasajeros", "Rutas compartidas", "Tarifas reducidas", "Nuevas conexiones"],
      price: "Desde C$30",
      color: "bg-green-500",
    },
    {
      icon: Star,
      title: "SafeRide Premium",
      description: "Experiencia de lujo con vehículos premium",
      features: ["Vehículos de alta gama", "Conductores VIP", "Agua y amenidades", "Servicio personalizado"],
      price: "Desde C$150",
      color: "bg-purple-500",
    },
  ]

  const additionalServices = [
    {
      icon: Package,
      title: "SafeDelivery",
      description: "Entrega de paquetes y documentos",
      color: "bg-cyan-500",
    },
    {
      icon: Truck,
      title: "SafeCargo",
      description: "Transporte de carga y mudanzas",
      color: "bg-indigo-500",
    },
    {
      icon: Plane,
      title: "SafeAirport",
      description: "Traslados al aeropuerto",
      color: "bg-teal-500",
    },
    {
      icon: Heart,
      title: "SafeCare",
      description: "Transporte médico y emergencias",
      color: "bg-red-500",
    },
    {
      icon: Calendar,
      title: "SafeSchedule",
      description: "Viajes programados y recurrentes",
      color: "bg-yellow-500",
    },
    {
      icon: Phone,
      title: "SafeCall",
      description: "Solicitud telefónica 24/7",
      color: "bg-pink-500",
    },
  ]

  const benefits = [
    "Conductores verificados con antecedentes penales limpios",
    "Vehículos inspeccionados y con seguro completo",
    "Seguimiento GPS en tiempo real",
    "Soporte 24/7 en español",
    "Tarifas fijas sin sorpresas",
    "Múltiples métodos de pago",
    "Calificación y comentarios de usuarios",
    "Botón de emergencia integrado",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
            <Car className="w-4 h-4 mr-2" />
            Servicios de Transporte
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Nuestros Servicios
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Descubre todas las opciones de transporte seguro que SafeRide tiene para ti. Desde viajes cotidianos hasta
            servicios especializados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Link href="/auth/register" className="flex items-center">
                Comenzar Ahora
                <Car className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              <Link href="/support">Ver Precios Detallados</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Servicios Principales</h2>
            <p className="text-lg text-gray-600">Elige el servicio que mejor se adapte a tus necesidades</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {mainServices.map((service, index) => (
              <Card
                key={index}
                className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${service.color} text-white`}>
                      <service.icon className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {service.price}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{service.title}</CardTitle>
                  <CardDescription className="text-gray-600">{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    Solicitar Ahora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Servicios Especializados</h2>
            <p className="text-lg text-gray-600">Soluciones específicas para necesidades particulares</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalServices.map((service, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-16 h-16 mx-auto rounded-full ${service.color} flex items-center justify-center mb-4`}
                  >
                    <service.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900">{service.title}</CardTitle>
                  <CardDescription className="text-gray-600">{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="outline" className="w-full">
                    Más Información
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Por qué elegir SafeRide?</h2>
            <p className="text-lg text-gray-600">Beneficios que nos hacen diferentes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-100"
              >
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">¿Listo para comenzar?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a miles de usuarios que ya confían en SafeRide para sus viajes diarios
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link href="/auth/register">Registrarse Gratis</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="/support">Contactar Soporte</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
