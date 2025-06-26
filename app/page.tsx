"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Car,
  Shield,
  Star,
  Users,
  MapPin,
  Clock,
  Phone,
  ArrowRight,
  Zap,
  Heart,
  Award,
  TrendingUp,
  Globe,
} from "lucide-react"
import Link from "next/link"
import { DevelopmentNotice } from "@/components/DevelopmentNotice"

export default function HomePage() {
  const [currentStat, setCurrentStat] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const stats = [
    { number: "50,000+", label: "Viajes Completados", icon: Car, color: "text-blue-600" },
    { number: "10,000+", label: "Usuarios Activos", icon: Users, color: "text-green-600" },
    { number: "500+", label: "Conductores Verificados", icon: Shield, color: "text-purple-600" },
    { number: "4.9★", label: "Calificación Promedio", icon: Star, color: "text-yellow-600" },
  ]

  const features = [
    {
      icon: Shield,
      title: "100% Seguro",
      description: "Conductores verificados y vehículos inspeccionados",
      color: "from-green-400 to-emerald-600",
      delay: "0ms",
    },
    {
      icon: Zap,
      title: "Súper Rápido",
      description: "Llegada promedio en menos de 5 minutos",
      color: "from-blue-400 to-cyan-600",
      delay: "200ms",
    },
    {
      icon: Heart,
      title: "Confiable",
      description: "Disponible 24/7 con soporte en español",
      color: "from-purple-400 to-pink-600",
      delay: "400ms",
    },
    {
      icon: Award,
      title: "Calidad Premium",
      description: "Experiencia de viaje de primera clase",
      color: "from-orange-400 to-red-600",
      delay: "600ms",
    },
  ]

  const services = [
    {
      name: "SafeRide Estándar",
      price: "Desde C$50",
      description: "Viajes cómodos para el día a día",
      popular: false,
      color: "border-blue-200 hover:border-blue-400",
    },
    {
      name: "SafeRide Express",
      price: "Desde C$75",
      description: "Llegada rápida cuando tienes prisa",
      popular: true,
      color: "border-purple-200 hover:border-purple-400",
    },
    {
      name: "SafeRide Premium",
      price: "Desde C$150",
      description: "Experiencia de lujo con vehículos premium",
      popular: false,
      color: "border-green-200 hover:border-green-400",
    },
  ]

  const testimonials = [
    {
      name: "María González",
      role: "Estudiante",
      content: "SafeRide me ha cambiado la vida. Siempre llego segura a casa después de clases.",
      rating: 5,
      avatar: "MG",
    },
    {
      name: "Carlos Mendoza",
      role: "Empresario",
      content: "Uso SafeRide para todas mis reuniones de trabajo. Puntual y profesional.",
      rating: 5,
      avatar: "CM",
    },
    {
      name: "Ana Rodríguez",
      role: "Doctora",
      content: "Como médica, necesito transporte confiable 24/7. SafeRide nunca me falla.",
      rating: 5,
      avatar: "AR",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      <DevelopmentNotice />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div
              className={`space-y-8 transform transition-all duration-1000 ${
                isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
              }`}
            >
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-blue-700 text-sm font-medium animate-bounce">
                <Car className="w-4 h-4 mr-2" />
                ¡Bienvenido a SafeRide!
              </div>

              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                  Viaja Seguro
                </span>
                <br />
                <span className="text-gray-900">con SafeRide</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                La plataforma de transporte más <span className="font-semibold text-blue-600">segura</span> y{" "}
                <span className="font-semibold text-green-600">confiable</span> Conectamos pasajeros con
                conductores verificados para viajes seguros las 24 horas.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Link href="/auth/register" className="flex items-center">
                    Comenzar Ahora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-blue-500 px-8 py-4 text-lg font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <Link href="/driver/dashboard" className="flex items-center">
                    <Car className="mr-2 h-5 w-5" />
                    Conducir Ahora
                  </Link>
                </Button>
              </div>

              {/* Animated Stats */}
              <div className="grid grid-cols-2 gap-4 pt-8">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className={`text-center p-4 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg transform transition-all duration-500 hover:scale-105 ${
                      currentStat === index ? "ring-2 ring-blue-400 shadow-xl" : ""
                    }`}
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                    <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Animated Phone Mockup */}
            <div
              className={`relative transform transition-all duration-1000 delay-500 ${
                isVisible ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"
              }`}
            >
              <div className="relative mx-auto w-80 h-96 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-500">
                {/* Phone Screen */}
                <div className="absolute inset-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl overflow-hidden">
                  {/* Status Bar */}
                  <div className="h-6 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-between px-4 text-white text-xs">
                    <span>9:41</span>
                    <span>SafeRide</span>
                    <span>100%</span>
                  </div>

                  {/* App Content */}
                  <div className="p-6 space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">¿A dónde vamos?</h3>
                      <div className="bg-white rounded-lg p-3 shadow-md">
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-5 w-5 text-green-500" />
                          <span className="text-gray-600">Ingresa tu destino</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {services.slice(0, 2).map((service, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-3 shadow-md border-l-4 border-blue-500 animate-pulse"
                          style={{ animationDelay: `${index * 500}ms` }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{service.name}</div>
                              <div className="text-xs text-gray-600">{service.description}</div>
                            </div>
                            <div className="text-blue-600 font-bold text-sm">{service.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg py-3 animate-pulse">
                      Solicitar SafeRide
                    </Button>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-bounce"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full animate-bounce delay-1000"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SafeRide
              </span>
              ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ofrecemos la mejor experiencia de transporte con tecnología de punta y el más alto nivel de seguridad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm transform hover:scale-105 hover:-translate-y-2"
                style={{ animationDelay: feature.delay }}
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-500`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Nuestros Servicios</h2>
            <p className="text-xl text-gray-600">Elige el servicio que mejor se adapte a tus necesidades</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden hover:shadow-2xl transition-all duration-500 ${service.color} bg-white/90 backdrop-blur-sm transform hover:scale-105`}
              >
                {service.popular && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse">
                      Más Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{service.name}</CardTitle>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {service.price}
                  </div>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-gray-600">{service.description}</p>
                  <Button
                    className={`w-full ${
                      service.popular
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    } transform hover:scale-105 transition-all duration-300`}
                  >
                    Solicitar Ahora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <Link href="/services" className="flex items-center">
                Ver Todos los Servicios
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Lo que dicen nuestros usuarios</h2>
            <p className="text-xl text-gray-600">Miles de nicaragüenses ya confían en SafeRide</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm transform hover:scale-105 hover:-translate-y-2"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg mb-4">
                    {testimonial.avatar}
                  </div>
                  <div className="flex justify-center mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-gray-600 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-pulse">¿Listo para tu primer viaje?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Únete a la revolución del transporte seguro en Nicaragua. Descarga la app y comienza a viajar con confianza
            hoy mismo.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Link href="/auth/register" className="flex items-center">
                <Car className="mr-2 h-6 w-6" />
                Registrarse Gratis
              </Link>
            </Button>

            <div className="flex items-center space-x-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 border-2 border-white flex items-center justify-center text-white font-bold animate-bounce"
                    style={{ animationDelay: `${i * 200}ms` }}
                  >
                    {i}
                  </div>
                ))}
              </div>
              <div className="text-white">
                <div className="font-semibold">+10,000 usuarios</div>
                <div className="text-sm text-blue-100">ya confían en nosotros</div>
              </div>
            </div>
          </div>

          {/* Floating Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {[
              { icon: TrendingUp, label: "Crecimiento", value: "+200%" },
              { icon: Globe, label: "Ciudades", value: "15+" },
              { icon: Clock, label: "Disponible", value: "24/7" },
              { icon: Phone, label: "Soporte", value: "Inmediato" },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <stat.icon className="h-8 w-8 text-white mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-green-500/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {/* Company Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center space-x-3 group">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      SafeRide
                    </span>
                    <div className="text-sm text-gray-400">Transporte Seguro Nicaragua</div>
                  </div>
                </div>

                <p className="text-gray-300 max-w-md leading-relaxed">
                  Conectamos personas de manera segura y confiable en toda Nicaragua. Tu seguridad es nuestra prioridad
                  número uno.
                </p>

                {/* Social Media */}
                <div className="flex space-x-4">
                  {[
                    { name: "Facebook", icon: "📘" },
                    { name: "Instagram", icon: "📷" },
                    { name: "Twitter", icon: "🐦" },
                    { name: "WhatsApp", icon: "💬" },
                  ].map((social, index) => (
                    <button
                      key={index}
                      className="w-12 h-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl flex items-center justify-center text-xl hover:from-blue-500/30 hover:to-purple-500/30 transform hover:scale-110 transition-all duration-300 hover:shadow-lg"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {social.icon}
                    </button>
                  ))}
                </div>

                {/* App Download */}
                <div className="space-y-3">
                  <p className="text-gray-300 font-semibold">Descarga la App:</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className="flex items-center space-x-3 bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 rounded-xl hover:from-gray-700 hover:to-gray-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                      <div className="text-2xl">📱</div>
                      <div className="text-left">
                        <div className="text-xs text-gray-400">Disponible en</div>
                        <div className="font-semibold">App Store</div>
                      </div>
                    </button>
                    <button className="flex items-center space-x-3 bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 rounded-xl hover:from-gray-700 hover:to-gray-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                      <div className="text-2xl">🤖</div>
                      <div className="text-left">
                        <div className="text-xs text-gray-400">Disponible en</div>
                        <div className="font-semibold">Google Play</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Car className="h-5 w-5 mr-2 text-blue-400" />
                  Servicios
                </h3>
                <ul className="space-y-3">
                  {[
                    "SafeRide Estándar",
                    "SafeRide Express",
                    "SafeRide Premium",
                    "SafeRide Delivery",
                    "SafeRide Airport",
                    "SafeRide Schedule",
                  ].map((service, index) => (
                    <li key={index}>
                      <Link
                        href="/services"
                        className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center group"
                      >
                        <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                        {service}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support & Company */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-400" />
                  Empresa
                </h3>
                <ul className="space-y-3">
                  {[
                    { name: "Acerca de SafeRide", href: "/about" },
                    { name: "Seguridad", href: "/safety" },
                    { name: "Soporte", href: "/support" },
                    { name: "Carreras", href: "/careers" },
                    { name: "Blog", href: "/blog" },
                    { name: "Prensa", href: "/press" },
                  ].map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-gray-300 hover:text-green-400 transition-colors duration-300 flex items-center group"
                      >
                        <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Contact Info */}
                <div className="mt-8 space-y-3">
                  <h4 className="font-semibold text-white flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-purple-400" />
                    Contacto
                  </h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center">
                      <span className="mr-2">📞</span>
                      <span>+505 2222-3333</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">📧</span>
                      <span>hola@saferide.ni</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">📍</span>
                      <span>Managua, Nicaragua</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="border-t border-gray-700/50 pt-8 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { number: "50K+", label: "Viajes Completados", icon: Car, color: "text-blue-400" },
                  { number: "10K+", label: "Usuarios Activos", icon: Users, color: "text-green-400" },
                  { number: "500+", label: "Conductores", icon: Shield, color: "text-purple-400" },
                  { number: "24/7", label: "Disponibilidad", icon: Clock, color: "text-yellow-400" },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="text-center p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl hover:from-gray-700/50 hover:to-gray-600/50 transition-all duration-300 transform hover:scale-105 group"
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <stat.icon
                      className={`h-8 w-8 mx-auto mb-2 ${stat.color} group-hover:scale-110 transition-transform duration-300`}
                    />
                    <div className="text-2xl font-bold text-white">{stat.number}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-700/50 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-gray-400 text-center md:text-left">
                <p>&copy; 2024 SafeRide Nicaragua. Todos los derechos reservados.</p>
                <p className="text-sm mt-1">Viaja seguro, viaja con confianza. 🇳🇮</p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm">
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Términos de Servicio
                </Link>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Política de Privacidad
                </Link>
                <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Cookies
                </Link>
              </div>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6 z-50">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full w-16 h-16 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 animate-bounce"
              >
                <Link href="/auth/register">
                  <Car className="h-8 w-8" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
