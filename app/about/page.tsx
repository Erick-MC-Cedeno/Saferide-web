"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Star,
  Users,
  Car,
  Heart,
  Award,
  Target,
  Eye,
  Globe,
  Calendar,
  MapPin,
  Phone,
  Linkedin,
  Twitter,
  Sparkles,
  Clock,
  Building,
  Rocket,
  Lightbulb,
  Handshake,
} from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStat, setCurrentStat] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % 6)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const stats = [
    { number: "2024", label: "Año de Fundación", icon: Calendar, color: "text-blue-600" },
    { number: "50K+", label: "Viajes Completados", icon: Car, color: "text-green-600" },
    { number: "10K+", label: "Usuarios Activos", icon: Users, color: "text-purple-600" },
    { number: "500+", label: "Conductores", icon: Shield, color: "text-orange-600" },
    { number: "15+", label: "Ciudades", icon: MapPin, color: "text-red-600" },
    { number: "4.9★", label: "Calificación", icon: Star, color: "text-yellow-600" },
  ]

  const values = [
    {
      icon: Shield,
      title: "Seguridad Primero",
      description: "La seguridad de nuestros usuarios es nuestra máxima prioridad en cada viaje",
      color: "from-blue-500 to-cyan-600",
      delay: "0ms",
    },
    {
      icon: Heart,
      title: "Compromiso Social",
      description: "Contribuimos al desarrollo económico y social de la región",
      color: "from-red-500 to-pink-600",
      delay: "200ms",
    },
    {
      icon: Lightbulb,
      title: "Innovación",
      description: "Utilizamos tecnología de punta para mejorar la experiencia de transporte",
      color: "from-yellow-500 to-orange-600",
      delay: "400ms",
    },
    {
      icon: Handshake,
      title: "Confianza",
      description: "Construimos relaciones duraderas basadas en la transparencia y honestidad",
      color: "from-green-500 to-emerald-600",
      delay: "600ms",
    },
  ]

  const timeline = [
    {
      year: "2024",
      title: "Fundación de SafeRide",
      description: "Nace SafeRide con la visión de revolucionar el transporte",
      icon: Rocket,
      color: "from-blue-500 to-purple-600",
    },
    {
      year: "2024",
      title: "Lanzamiento en la capital",
      description: "Iniciamos operaciones en la capital con 50 conductores certificados",
      icon: MapPin,
      color: "from-green-500 to-blue-600",
    },
    {
      year: "2024",
      title: "Expansión Nacional",
      description: "Llegamos a 15 ciudades principales",
      icon: Globe,
      color: "from-purple-500 to-indigo-600",
    },
    {
      year: "2024",
      title: "50,000 Viajes",
      description: "Alcanzamos la marca de 50,000 viajes completados exitosamente",
      icon: Award,
      color: "from-orange-500 to-red-600",
    },
  ]

  const team = [
    {
      name: "Carlos Mendoza",
      role: "CEO & Fundador",
      description: "Visionario con 15 años de experiencia en tecnología y transporte",
      avatar: "CM",
      social: { linkedin: "#", twitter: "#" },
    },
    {
      name: "María González",
      role: "CTO",
      description: "Experta en desarrollo de aplicaciones móviles y sistemas escalables",
      avatar: "MG",
      social: { linkedin: "#", twitter: "#" },
    },
    {
      name: "Roberto Silva",
      role: "Director de Operaciones",
      description: "Especialista en logística y optimización de rutas urbanas",
      avatar: "RS",
      social: { linkedin: "#", twitter: "#" },
    },
    {
      name: "Ana Rodríguez",
      role: "Directora de Seguridad",
      description: "Responsable de todos los protocolos de seguridad y verificación",
      avatar: "AR",
      social: { linkedin: "#", twitter: "#" },
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-400/15 to-indigo-600/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-orange-400/15 to-red-600/15 rounded-full blur-3xl animate-pulse delay-3000"></div>

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full animate-ping opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center space-y-8">
            <div
              className={`transform transition-all duration-1000 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-6 py-2 text-lg font-medium animate-bounce mb-6">
                <Building className="w-5 h-5 mr-2" />
                Conoce Nuestra Historia
              </Badge>

              <h1 className="text-6xl md:text-8xl font-bold leading-tight mb-8">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
                  Acerca de
                </span>
                <br />
                <span className="text-gray-900 relative">
                  SafeRide
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
                </span>
              </h1>

              <p className="text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto mb-12">
                Somos un SAAS de internet especializado en soluciones de transporte, conectando personas de manera
                <span className="font-bold text-green-600"> segura, confiable y accesible</span> y ofreciendo tecnología
                que mejora la movilidad urbana.
              </p>
            </div>

            {/* Animated Stats */}
            <div
              className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 transform transition-all duration-1000 delay-500 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              {stats.map((stat, index) => (
                <Card
                  key={index}
                  className={`text-center p-6 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transform transition-all duration-500 hover:scale-110 hover:-translate-y-2 ${
                    currentStat === index ? "ring-4 ring-blue-400 shadow-2xl scale-105" : ""
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <stat.icon className={`h-12 w-12 mx-auto mb-4 ${stat.color} animate-bounce`} />
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Mission */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm transform hover:scale-105 hover:-translate-y-4">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-500 shadow-xl">
                  <Target className="h-10 w-10 text-white animate-pulse" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                  Nuestra Misión
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg text-gray-600 leading-relaxed">
                  Proporcionar un servicio de transporte{" "}
                  <span className="font-bold text-blue-600">seguro, confiable y accesible</span> que conecte a las
                  personas, mejorando su calidad de vida y contribuyendo al desarrollo económico del país.
                </p>
              </CardContent>
            </Card>

            {/* Vision */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm transform hover:scale-105 hover:-translate-y-4">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-500 shadow-xl">
                  <Eye className="h-10 w-10 text-white animate-pulse" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors duration-300">
                  Nuestra Visión
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg text-gray-600 leading-relaxed">
                  Ser la plataforma de transporte{" "}
                  <span className="font-bold text-purple-600">líder en Centroamérica</span>, reconocida por nuestra
                  innovación tecnológica, compromiso con la seguridad y contribución al desarrollo sostenible de la
                  región.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Nuestros{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Valores
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Los principios que guían cada decisión y acción en SafeRide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm transform hover:scale-105 hover:-translate-y-4"
                style={{ animationDelay: value.delay }}
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${value.color} flex items-center justify-center mb-4 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg`}
                  >
                    <value.icon className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {value.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Nuestra{" "}
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Historia
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              El camino que nos ha llevado a ser líderes en transporte seguro
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>

            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"} group`}
                >
                  <div className={`w-1/2 ${index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"}`}>
                    <Card className="hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm transform hover:scale-105 group-hover:-translate-y-2">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-4">
                          <Badge
                            className={`bg-gradient-to-r ${item.color} text-white px-4 py-2 font-bold animate-pulse`}
                          >
                            {item.year}
                          </Badge>
                          <div
                            className={`p-3 rounded-xl bg-gradient-to-r ${item.color} text-white shadow-lg group-hover:rotate-12 group-hover:scale-110 transition-all duration-500`}
                          >
                            <item.icon className="h-6 w-6" />
                          </div>
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 leading-relaxed">{item.description}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Timeline Dot */}
                  <div className="relative z-10">
                    <div
                      className={`w-6 h-6 rounded-full bg-gradient-to-r ${item.color} border-4 border-white shadow-lg animate-pulse`}
                    ></div>
                  </div>

                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Nuestro{" "}
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Equipo
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Las mentes brillantes detrás de la revolución del transporte
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm transform hover:scale-105 hover:-translate-y-4"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl">
                    {member.avatar}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {member.name}
                  </CardTitle>
                  <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 mt-2">
                    {member.role}
                  </Badge>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-gray-600 text-sm leading-relaxed">{member.description}</p>
                  <div className="flex justify-center space-x-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full p-2 hover:bg-blue-500 hover:text-white transition-all duration-300 transform hover:scale-110 bg-transparent"
                    >
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full p-2 hover:bg-blue-400 hover:text-white transition-all duration-300 transform hover:scale-110 bg-transparent"
                    >
                      <Twitter className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            <span className="animate-bounce inline-block">¿</span>
            <span className="animate-pulse">Listo para</span>
            <span className="animate-bounce inline-block delay-100"> ser</span>
            <span className="animate-pulse delay-200"> parte</span>
            <span className="animate-bounce inline-block delay-300"> de</span>
            <span className="animate-pulse delay-400"> SafeRide</span>
            <span className="animate-bounce inline-block delay-500">?</span>
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Únete a nuestra misión de transformar el transporte. Juntos construimos un futuro más seguro y
            conectado.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Link href="/auth/register" className="flex items-center">
                <Car className="mr-2 h-6 w-6" />
                Comenzar Ahora
                <Sparkles className="ml-2 h-5 w-5 animate-pulse" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 bg-transparent"
            >
              <Link href="/support" className="flex items-center">
                <Phone className="mr-2 h-6 w-6" />
                Contáctanos
              </Link>
            </Button>
          </div>

          {/* Floating Elements */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {[
              { icon: Shield, label: "Seguridad", value: "100%" },
              { icon: Clock, label: "Disponible", value: "24/7" },
              { icon: Users, label: "Usuarios", value: "10K+" },
              { icon: Star, label: "Calificación", value: "4.9★" },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <stat.icon className="h-8 w-8 text-white mx-auto mb-2 animate-pulse" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
