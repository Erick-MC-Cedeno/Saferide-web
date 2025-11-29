"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Download,
  ExternalLink,
  FileText,
  ImageIcon,
  Video,
  Award,
  TrendingUp,
  Users,
  Globe,
  Phone,
  Mail,
  Newspaper,
  Camera,
  Radio,
  Tv,
  Star,
  Eye,
  Share2,
  BookOpen,
  Megaphone,
  Target,
  Zap,
} from "lucide-react"

export default function PressPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("Todos")

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const pressReleases = [
    {
      id: 1,
      title: "SafeRide Alcanza 50,000 Viajes Completados",
      date: "15 de Diciembre, 2024",
      category: "Hito Empresarial",
      excerpt:
        "SafeRide celebra un momento histórico al completar 50,000 viajes seguros en nuestra plataforma, consolidándose como líder en transporte digital.",
      type: "Comunicado de Prensa",
      downloads: 245,
      views: 1250,
      featured: true,
    },
    {
      id: 2,
      title: "Expansión de SafeRide a 15 Ciudades",
      date: "5 de Diciembre, 2024",
      category: "Expansión",
      excerpt:
        "La plataforma de transporte seguro anuncia su llegada a nuevas ciudades, llevando movilidad confiable a más usuarios.",
      type: "Nota de Prensa",
      downloads: 189,
      views: 890,
      featured: false,
    },
    {
      id: 3,
      title: "SafeRide Implementa Nuevos Protocolos de Seguridad",
      date: "28 de Noviembre, 2024",
      category: "Seguridad",
      excerpt:
        "La empresa refuerza su compromiso con la seguridad implementando protocolos adicionales para conductores y pasajeros.",
      type: "Comunicado",
      downloads: 156,
      views: 670,
      featured: false,
    },
    {
      id: 4,
      title: "Alianza Estratégica con Instituciones de Seguridad",
      date: "20 de Noviembre, 2024",
      category: "Alianzas",
      excerpt:
        "SafeRide firma acuerdos de colaboración con autoridades locales para fortalecer la seguridad en el transporte urbano.",
      type: "Comunicado de Prensa",
      downloads: 198,
      views: 1120,
      featured: false,
    },
  ]

  const mediaKit = [
    {
      name: "Logo SafeRide (PNG)",
      type: "image",
      size: "2.3 MB",
      description: "Logo oficial en alta resolución con fondo transparente",
      icon: ImageIcon,
      color: "from-blue-500 to-cyan-600",
    },
    {
      name: "Kit de Marca Completo",
      type: "zip",
      size: "15.7 MB",
      description: "Logos, colores, tipografías y guías de uso",
      icon: FileText,
      color: "from-purple-500 to-indigo-600",
    },
    {
      name: "Fotos Corporativas",
      type: "zip",
      size: "45.2 MB",
      description: "Imágenes del equipo y oficinas en alta resolución",
      icon: Camera,
      color: "from-green-500 to-emerald-600",
    },
    {
      name: "Video Corporativo",
      type: "video",
      size: "128 MB",
      description: "Video institucional de SafeRide (MP4, 1080p)",
      icon: Video,
      color: "from-red-500 to-pink-600",
    },
  ]

  const mediaContacts = [
    {
      name: "Carlos Mendoza",
      role: "CEO & Portavoz Principal",
      email: "carlos.mendoza@saferide.ni",
      phone: "+505 8888-1111",
      specialties: ["Estrategia Empresarial", "Visión de Futuro", "Expansión"],
      avatar: "CM",
    },
    {
      name: "María González",
      role: "Directora de Comunicaciones",
      email: "maria.gonzalez@saferide.ni",
      phone: "+505 8888-2222",
      specialties: ["Relaciones Públicas", "Comunicación Corporativa", "Medios"],
      avatar: "MG",
    },
    {
      name: "Ana Rodríguez",
      role: "Directora de Seguridad",
      email: "ana.rodriguez@saferide.ni",
      phone: "+505 8888-3333",
      specialties: ["Protocolos de Seguridad", "Certificaciones", "Capacitación"],
      avatar: "AR",
    },
  ]

  const mediaAppearances = [
    {
      outlet: "Canal 2 Televisión",
      program: "Buenos Días",
      date: "10 de Diciembre, 2024",
      type: "Entrevista TV",
      topic: "El Futuro del Transporte",
      duration: "15 min",
      icon: Tv,
    },
    {
      outlet: "Radio Ya",
      program: "Hoy por Hoy",
      date: "8 de Diciembre, 2024",
      type: "Entrevista Radio",
      topic: "Seguridad en el Transporte Digital",
      duration: "20 min",
      icon: Radio,
    },
    {
      outlet: "La Prensa",
      program: "Sección Tecnología",
      date: "5 de Diciembre, 2024",
      type: "Artículo",
      topic: "SafeRide: Innovación Nicaragüense",
      duration: "Artículo completo",
      icon: Newspaper,
    },
    {
      outlet: "El Nuevo Diario",
      program: "Economía Digital",
      date: "3 de Diciembre, 2024",
      type: "Reportaje",
      topic: "Emprendimiento y Tecnología",
      duration: "Reportaje especial",
      icon: BookOpen,
    },
  ]

  const awards = [
    {
      name: "Mejor Startup Tecnológica 2024",
      organization: "Cámara de Comercio",
      date: "Noviembre 2024",
      description: "Reconocimiento a la innovación en transporte digital",
      icon: Award,
      color: "from-yellow-500 to-orange-600",
    },
    {
      name: "Premio a la Seguridad Digital",
      organization: "Ministerio de Transporte",
      date: "Octubre 2024",
      description: "Por implementar los más altos estándares de seguridad",
      icon: Star,
      color: "from-blue-500 to-purple-600",
    },
    {
      name: "Empresa del Año - Categoría Transporte",
      organization: "Asociación de Empresarios",
      date: "Septiembre 2024",
      description: "Reconocimiento al impacto social y económico",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-600",
    },
  ]

  const categories = ["Todos", "Hito Empresarial", "Expansión", "Seguridad", "Alianzas"]

  const filteredReleases = pressReleases.filter(
    (release) => selectedCategory === "Todos" || release.category === selectedCategory,
  )

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
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <div
              className={`transform transition-all duration-1000 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-6 py-2 text-lg font-medium animate-bounce mb-6">
                <Megaphone className="w-5 h-5 mr-2" />
                Sala de Prensa SafeRide
              </Badge>

              <h1 className="text-6xl md:text-8xl font-bold leading-tight mb-8">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
                  Prensa
                </span>
                <br />
                <span className="text-gray-900 relative">
                  & Medios
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
                </span>
              </h1>

              <p className="text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto mb-12">
                Centro de recursos para{" "}
                <span className="font-bold text-blue-600 animate-pulse">periodistas y medios</span> de comunicación.
                Encuentra aquí toda la información oficial de{" "}
                <span className="font-bold text-green-600">SafeRide</span>.
              </p>
            </div>

            {/* Quick Stats */}
            <div
              className={`grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto transform transition-all duration-1000 delay-300 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              {[
                { number: "50K+", label: "Viajes Completados", icon: Target, color: "text-blue-600" },
                { number: "15+", label: "Ciudades", icon: Globe, color: "text-green-600" },
                { number: "500+", label: "Conductores", icon: Users, color: "text-purple-600" },
                { number: "24/7", label: "Disponibilidad", icon: Zap, color: "text-orange-600" },
              ].map((stat, index) => (
                <Card
                  key={index}
                  className="text-center p-6 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transform transition-all duration-500 hover:scale-110 hover:-translate-y-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <stat.icon className={`h-10 w-10 mx-auto mb-3 ${stat.color} animate-pulse`} />
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Comunicados de{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Prensa</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Las últimas noticias y anuncios oficiales de SafeRide
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-white/80 backdrop-blur-sm hover:bg-gray-50 border-2"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Press Releases Grid */}
          <div className="space-y-8">
            {filteredReleases.map((release, index) => (
              <Card
                key={release.id}
                className={`group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm transform hover:scale-[1.02] ${
                  release.featured ? "ring-4 ring-yellow-400 ring-opacity-50" : ""
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-8">
                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      {release.featured && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 font-bold animate-pulse">
                          <Star className="w-4 h-4 mr-1" />
                          DESTACADO
                        </Badge>
                      )}
                      <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-3 py-1">
                        {release.category}
                      </Badge>
                      <Badge variant="outline" className="text-gray-600">
                        {release.type}
                      </Badge>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                      {release.title}
                    </h3>

                    <p className="text-gray-600 leading-relaxed text-lg">{release.excerpt}</p>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {release.date}
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-2 text-green-500" />
                        {release.views} vistas
                      </div>
                      <div className="flex items-center">
                        <Download className="h-4 w-4 mr-2 text-blue-500" />
                        {release.downloads} descargas
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center space-y-3">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar PDF
                    </Button>
                    <Button
                      variant="outline"
                      className="border-2 hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 bg-transparent"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartir
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transform hover:scale-105 transition-all duration-300"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver Online
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Kit de{" "}
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Medios</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Recursos gráficos y multimedia para uso editorial</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {mediaKit.map((item, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm transform hover:scale-105 hover:-translate-y-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center mb-4 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg`}
                  >
                    <item.icon className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {item.name}
                  </CardTitle>
                  <Badge className="bg-gray-100 text-gray-600 text-xs">{item.size}</Badge>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Media Contacts */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Contactos de{" "}
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Prensa
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nuestro equipo está disponible para entrevistas y consultas de medios
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mediaContacts.map((contact, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm transform hover:scale-105 hover:-translate-y-4"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl">
                    {contact.avatar}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {contact.name}
                  </CardTitle>
                  <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 mt-2">
                    {contact.role}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-blue-500" />
                      {contact.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-green-500" />
                      {contact.phone}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Especialidades:</h4>
                    <div className="flex flex-wrap gap-2">
                      {contact.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300">
                    <Mail className="mr-2 h-4 w-4" />
                    Contactar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Media Appearances */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Apariciones en{" "}
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">Medios</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nuestras últimas entrevistas y apariciones en medios de comunicación
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mediaAppearances.map((appearance, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm transform hover:scale-105 hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg group-hover:rotate-12 group-hover:scale-110 transition-all duration-500`}
                    >
                      <appearance.icon className="h-6 w-6" />
                    </div>
                    <Badge className="bg-gradient-to-r from-red-100 to-orange-100 text-red-700">
                      {appearance.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {appearance.outlet}
                  </CardTitle>
                  <p className="text-purple-600 font-semibold">{appearance.program}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 font-medium">{appearance.topic}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {appearance.date}
                    </div>
                    <div className="text-blue-600 font-medium">{appearance.duration}</div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-2 hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 bg-transparent"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver/Escuchar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Awards & Recognition */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Premios y{" "}
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Reconocimientos
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Los logros y reconocimientos que hemos recibido por nuestro trabajo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {awards.map((award, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm transform hover:scale-105 hover:-translate-y-4"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-r ${award.color} flex items-center justify-center mb-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-xl`}
                  >
                    <award.icon className="h-10 w-10 text-white animate-pulse" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                    {award.name}
                  </CardTitle>
                  <Badge className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 mt-2">{award.date}</Badge>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-gray-600 font-semibold">{award.organization}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{award.description}</p>
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
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-pulse">¿Necesitas más información?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Nuestro equipo de comunicaciones está disponible para atender consultas de medios, programar entrevistas y
            proporcionar información adicional.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Mail className="mr-2 h-6 w-6" />
              Contactar Prensa
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 bg-transparent"
            >
              <Download className="mr-2 h-6 w-6" />
              Descargar Kit
            </Button>
          </div>

          <div className="mt-12 text-center">
            <p className="text-blue-200 text-lg">📧 prensa@saferide.ni | 📞 +505 8888-0000</p>
          </div>
        </div>
      </section>
    </div>
  )
}
