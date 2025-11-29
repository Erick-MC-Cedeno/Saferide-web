"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Car, Star, Users, Zap, Phone, Calendar, Package, Truck, Plane, Heart, CheckCircle, Crown, Sparkles, Clock, Infinity, Shield, MapPin, CreditCard } from "lucide-react"
import DevChatButton from "@/components/DevChatButton"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function ServicesPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])

  const subscriptionPlans = [
    {
      icon: Car,
      title: "SafeRide Estándar",
      description: "Perfecto para uso ocasional y viajes esporádicos",
      duration: "5 días",
      price: "$1.50",
      originalPrice: "$2.00",
      features: [
        "Solicitudes ilimitadas por 5 días completos",
        "Vehículos verificados y seguros",
        "Conductores certificados profesionales",
        "Seguimiento GPS en tiempo real",
        "Soporte técnico básico",
        "Tarifas transparentes sin sorpresas",
      ],
      color: "from-blue-500 to-blue-700",
      borderColor: "border-blue-200",
      popular: false,
      savings: "25% OFF",
      bgGlow: "bg-blue-500/10",
    },
    {
      icon: Zap,
      title: "SafeRide Plus",
      description: "Ideal para uso regular y frecuente",
      duration: "15 días",
      price: "$3.50",
      originalPrice: "$5.00",
      features: [
        "Solicitudes ilimitadas por 15 días completos",
        "Prioridad máxima en asignación de conductores",
        "Rutas inteligentes optimizadas",
        "Soporte prioritario 24/7",
        "Descuentos especiales en servicios adicionales",
      ],
      color: "from-purple-500 to-purple-700",
      borderColor: "border-purple-200",
      popular: true,
      savings: "30% OFF",
      bgGlow: "bg-purple-500/10",
    },
    {
      icon: Crown,
      title: "SafeRide Premium",
      description: "La experiencia de transporte más completa",
      duration: "1 mes completo",
      price: "$6.99",
      originalPrice: "$9.99",
      features: [
        "Solicitudes ilimitadas por 30 días completos",
        "Conductores VIP con certificación especial",
        "Soporte dedicado 24/7 con chat directo",
        "Cancelaciones gratuitas sin restricciones",
        "Programa de recompensas exclusivo",
        "Descuentos especiales en servicios adicionales",
      ],
      color: "from-amber-500 to-orange-600",
      borderColor: "border-amber-200",
      popular: false,
      savings: "35% OFF",
      bgGlow: "bg-amber-500/10",
    },
  ]

  const additionalServices = [
    {
      icon: Package,
      title: "SafeDelivery",
      description: "Entrega segura de paquetes y documentos importantes",
      color: "from-cyan-500 to-teal-600",
      features: ["Entrega en el mismo día", "Seguimiento en tiempo real", "Confirmación de entrega"],
    },
    {
      icon: Car,
      title: "Quik Drives en cualquier lugar",
      description:
        "Servicio rápido y flexible de SafeRide: solicita un vehículo al instante para cualquier destino dentro de la ciudad o sus alrededores, con seguimiento en tiempo real.",
      color: "from-blue-500 to-indigo-600",
      features: ["Solicitud instantánea", "Seguimiento en tiempo real", "Llegada rápida"],
    },
    // Servicios eliminados según solicitud: SafeCargo, SafeAirport, SafeCare, SafeSchedule, SafeCall
  ]

  const benefits = [
    { icon: MapPin, text: "Seguimiento GPS en tiempo real para tu seguridad" },
    { icon: Phone, text: "Soporte técnico 24/7 disponible en español" },
    { icon: CreditCard, text: "Tarifas fijas transparentes sin costos ocultos" },
    { icon: Users, text: "Sistema de calificaciones y comentarios verificados" },
    { icon: Sparkles, text: "Botón de emergencia integrado para tu protección" },
  ]

  const stats = [
    { number: "2,500+", label: "Usuarios Activos", icon: Users },
    { number: "75K+", label: "Viajes Completados", icon: Car },
    { number: "4.9★", label: "Calificación Promedio", icon: Star },
    { number: "24/7", label: "Soporte Disponible", icon: Phone },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse delay-1500"></div>
      </div>

      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-blue-400/30 rounded-full animate-bounce`}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + i * 0.3}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-7xl mx-auto text-center transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-blue-700 text-sm font-medium mb-8 animate-bounce shadow-lg">
            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
            Planes de Suscripción Premium
            <Sparkles className="w-4 h-4 ml-2 animate-spin" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-8 leading-tight">
            Nuestros Servicios
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
            Descubre el plan perfecto para tus necesidades de transporte.
            <br />
            <span className="font-semibold text-purple-600 animate-pulse">Solicitudes ilimitadas</span> con la mejor
            calidad de servicio.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-110 transition-all duration-300 shadow-xl hover:shadow-2xl px-10 py-4 text-lg font-semibold"
            >
              <Link href="/auth/register" className="flex items-center">
                Comenzar Gratis
                <Zap className="ml-2 h-5 w-5 animate-pulse" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-purple-300 hover:bg-purple-50 transform hover:scale-110 transition-all duration-300 px-10 py-4 text-lg font-semibold bg-white/80 backdrop-blur-sm"
            >
              <Link href="/support" className="flex items-center">
                Ver Detalles Completos
                <MapPin className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      {/* Floating Action Button - abrir saferide AI */}
      <div className="fixed bottom-6 right-6 z-50">
        <DevChatButton className="animate-bounce" />
      </div>

      {/* Subscription Plans */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center mb-20 transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Planes de Suscripción</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Solicitudes ilimitadas con precios increíbles.{" "}
              <span className="font-bold text-green-600">¡Ahorra hasta un 35%!</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {subscriptionPlans.map((plan, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden transition-all duration-700 delay-${
                  index * 150
                } border-2 ${plan.borderColor} bg-white/95 backdrop-blur-sm hover:shadow-2xl transform hover:scale-105 hover:-translate-y-2 ${
                  plan.popular ? "ring-4 ring-purple-400 ring-opacity-50 scale-105" : ""
                } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {plan.popular && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-2 text-sm font-bold animate-pulse shadow-lg">
                      <Star className="w-4 h-4 mr-1 animate-spin" />
                      MÁS POPULAR
                    </Badge>
                  </div>
                )}

                <div
                  className={`absolute inset-0 ${plan.bgGlow} transition-opacity duration-500 ${
                    hoveredCard === index ? "opacity-20" : "opacity-5"
                  }`}
                ></div>

                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/20 to-transparent rounded-bl-full"></div>

                <CardHeader className="pb-6 relative z-10 pt-12">
                  <div className="flex items-center justify-between mb-8">
                    <div
                      className={`p-4 rounded-2xl bg-gradient-to-br ${plan.color} text-white shadow-xl transform transition-all duration-500 ${
                        hoveredCard === index ? "scale-125 rotate-12 shadow-2xl" : ""
                      }`}
                    >
                      <plan.icon className="h-8 w-8" />
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 mb-3 animate-pulse font-bold px-3 py-1"
                      >
                        {plan.savings}
                      </Badge>
                      <div className="flex items-center justify-end">
                        <span className="text-lg text-gray-400 line-through mr-3">{plan.originalPrice}</span>
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      </div>
                    </div>
                  </div>

                  <CardTitle className="text-2xl font-bold text-gray-900 mb-3">{plan.title}</CardTitle>
                  <CardDescription className="text-gray-600 mb-6 text-base leading-relaxed">
                    {plan.description}
                  </CardDescription>

                  <div className="flex items-center justify-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 text-purple-600 font-bold">
                    <Clock className="w-5 h-5 mr-2" />
                    {plan.duration}
                    <Infinity className="w-6 h-6 ml-2 animate-spin text-blue-500" />
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 pb-8">
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start text-sm text-gray-700 transition-all duration-300 delay-${
                          idx * 50
                        } ${hoveredCard === index ? "translate-x-2" : ""}`}
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 animate-pulse mt-0.5" />
                        <span className="leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full bg-gradient-to-r ${plan.color} hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-white font-bold py-4 text-base shadow-lg`}
                  >
                    Seleccionar Plan
                    <Sparkles className="ml-2 h-5 w-5 animate-pulse" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center mb-20 transition-all duration-1000 delay-500 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Nuestros Servicios</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Soluciones especializadas para todas tus necesidades de transporte
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {additionalServices.map((service, index) => (
              <Card
                key={index}
                className={`w-full sm:w-80 hover:shadow-2xl transition-all duration-700 delay-${index * 100} border-0 bg-white/90 backdrop-blur-sm transform hover:scale-105 hover:-translate-y-1 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
                }`}
              >
                <CardHeader className="text-center pb-6">
                  <div
                    className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 shadow-xl transform transition-all duration-500 hover:scale-110 hover:rotate-12`}
                  >
                    <service.icon className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 mb-3">{service.title}</CardTitle>
                  <CardDescription className={
                    (service.title || "").toLowerCase().includes("quik")
                      ? "text-sm text-gray-600 mb-4 leading-relaxed"
                      : "text-gray-600 mb-4 leading-relaxed"
                  }>
                    {service.description}
                  </CardDescription>
                  <div className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    className="w-full hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transform hover:scale-105 transition-all duration-300 bg-white border-2 font-semibold"
                  >
                    Más Información
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center mb-20 transition-all duration-1000 delay-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">¿Por qué elegir SafeRide?</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Beneficios únicos que nos distinguen en el mercado nicaragüense
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`flex flex-col items-center text-center space-y-4 p-8 rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-100 hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-500 delay-${
                  index * 75
                } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              >
                <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                  <benefit.icon className="h-8 w-8 animate-pulse" />
                </div>
                <span className="text-sm text-gray-700 font-medium leading-relaxed">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center transition-all duration-700 delay-${index * 100} ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              >
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-12 w-12 text-white animate-bounce" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-blue-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/20 to-transparent animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-l from-purple-600/20 to-transparent animate-pulse delay-1000"></div>
        </div>

        <div
          className={`max-w-5xl mx-auto text-center relative z-10 transition-all duration-1000 delay-900 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="mb-12">
            <div className="flex justify-center mb-8">
              <Sparkles className="w-20 h-20 text-white animate-spin" />
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">¿Listo para comenzar?</h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed max-w-4xl mx-auto">
              Únete a miles de nicaragüenses que ya disfrutan de
              <span className="font-bold text-white"> solicitudes ilimitadas</span> con SafeRide.
              <br />
              <span className="text-lg text-blue-200">
                Tu transporte seguro y confiable está a un clic de distancia.
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-16">
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 transform hover:scale-110 transition-all duration-300 shadow-2xl px-12 py-5 text-xl font-bold"
            >
              <Link href="/auth/register" className="flex items-center">
                Registrarse Gratis
                <Crown className="ml-3 h-6 w-6 animate-bounce" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-purple-600 transform hover:scale-110 transition-all duration-300 px-12 py-5 text-xl font-bold bg-transparent"
            >
              <Link href="/support" className="flex items-center">
                Contactar Soporte
                <Phone className="ml-3 h-6 w-6" />
              </Link>
            </Button>
          </div>

          <div className="text-center text-blue-200">
            <p className="text-lg mb-4">
              ✨ Sin compromisos a largo plazo • Cancela cuando quieras • Soporte en español ✨
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
