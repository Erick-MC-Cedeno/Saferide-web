"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  User,
  Clock,
  ArrowRight,
  Search,
  Filter,
  Heart,
  MessageCircle,
  BookOpen,
  Star,
  Eye,
  Bookmark,
  Tag,
  Sparkles,
  Zap,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"

export default function BlogPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const categories = [
    { name: "Todos", count: 24, color: "from-blue-500 to-purple-600" },
    { name: "Seguridad", count: 8, color: "from-green-500 to-emerald-600" },
    { name: "Tecnología", count: 6, color: "from-purple-500 to-indigo-600" },
    { name: "Conductores", count: 5, color: "from-orange-500 to-red-600" },
    { name: "Noticias", count: 5, color: "from-cyan-500 to-blue-600" },
  ]

  const featuredPost = {
    id: 1,
    title: "SafeRide Alcanza 50,000 Viajes Completados",
    excerpt:
      "Un hito histórico que demuestra la confianza de nuestros usuarios en nuestra plataforma de transporte seguro.",
    content:
      "Hoy celebramos un momento histórico para SafeRide y para el transporte. Hemos alcanzado la increíble marca de 50,000 viajes completados exitosamente, lo que representa no solo números, sino historias de personas que han confiado en nosotros para llegar seguras a sus destinos...",
    author: "Carlos Mendoza",
    date: "15 de Diciembre, 2024",
    readTime: "5 min",
    category: "Noticias",
    image: "/placeholder.svg?height=400&width=800",
    likes: 234,
    comments: 45,
    views: 1250,
    featured: true,
  }

  const blogPosts = [
    {
      id: 2,
      title: "Nuevos Protocolos de Seguridad para Conductores",
      excerpt: "Implementamos medidas adicionales para garantizar la máxima seguridad en cada viaje.",
      author: "Ana Rodríguez",
      date: "12 de Diciembre, 2024",
      readTime: "3 min",
      category: "Seguridad",
      image: "/placeholder.svg?height=300&width=400",
      likes: 156,
      comments: 23,
      views: 890,
    },
    {
      id: 3,
      title: "Inteligencia Artificial en SafeRide: Optimizando Rutas",
      excerpt: "Cómo utilizamos IA para encontrar las rutas más eficientes y seguras para nuestros usuarios.",
      author: "María González",
      date: "10 de Diciembre, 2024",
      readTime: "7 min",
      category: "Tecnología",
      image: "/placeholder.svg?height=300&width=400",
      likes: 198,
      comments: 34,
      views: 1120,
    },
    {
      id: 4,
      title: "Historias de Conductores: El Impacto de SafeRide",
      excerpt: "Conoce las historias inspiradoras de nuestros conductores y cómo SafeRide ha cambiado sus vidas.",
      author: "Roberto Silva",
      date: "8 de Diciembre, 2024",
      readTime: "4 min",
      category: "Conductores",
      image: "/placeholder.svg?height=300&width=400",
      likes: 267,
      comments: 56,
      views: 1450,
    },
    {
      id: 5,
      title: "Expansión a 15 Ciudades: SafeRide Crece",
      excerpt: "Anunciamos nuestra expansión a nuevas ciudades, llevando transporte seguro a más nicaragüenses.",
      author: "Carlos Mendoza",
      date: "5 de Diciembre, 2024",
      readTime: "6 min",
      category: "Noticias",
      image: "/placeholder.svg?height=300&width=400",
      likes: 189,
      comments: 41,
      views: 980,
    },
    {
      id: 6,
      title: "Consejos de Seguridad para Pasajeros",
      excerpt: "Guía completa con las mejores prácticas para viajar seguro usando SafeRide.",
      author: "Ana Rodríguez",
      date: "3 de Diciembre, 2024",
      readTime: "5 min",
      category: "Seguridad",
      image: "/placeholder.svg?height=300&width=400",
      likes: 145,
      comments: 28,
      views: 756,
    },
    {
      id: 7,
      title: "El Futuro del Transporte Urbano",
      excerpt: "Nuestra visión sobre cómo la tecnología transformará la movilidad en las ciudades nicaragüenses.",
      author: "María González",
      date: "1 de Diciembre, 2024",
      readTime: "8 min",
      category: "Tecnología",
      image: "/placeholder.svg?height=300&width=400",
      likes: 223,
      comments: 67,
      views: 1340,
    },
  ]

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === "Todos" || post.category === selectedCategory
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-purple-400/15 to-indigo-600/15 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Floating Particles */}
        {[...Array(15)].map((_, i) => (
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
                <BookOpen className="w-5 h-5 mr-2" />
                Blog SafeRide
              </Badge>

              <h1 className="text-6xl md:text-8xl font-bold leading-tight mb-8">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
                  Noticias
                </span>
                <br />
                <span className="text-gray-900 relative">
                  & Actualizaciones
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
                </span>
              </h1>

              <p className="text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto mb-12">
                Mantente al día con las últimas{" "}
                <span className="font-bold text-blue-600 animate-pulse">noticias, actualizaciones</span> y{" "}
                <span className="font-bold text-green-600">consejos</span> de SafeRide.
              </p>
            </div>

            {/* Search and Filter */}
            <div
              className={`flex flex-col md:flex-row gap-4 justify-center items-center max-w-2xl mx-auto transform transition-all duration-1000 delay-300 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Buscar artículos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                />
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Filter className="mr-2 h-5 w-5" />
                Filtrar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={selectedCategory === category.name ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === category.name
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                    : "bg-white/80 backdrop-blur-sm hover:bg-gray-50 border-2"
                }`}
              >
                <Tag className="mr-2 h-4 w-4" />
                {category.name}
                <Badge className="ml-2 bg-white/20 text-current">{category.count}</Badge>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Artículo{" "}
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Destacado
              </span>
            </h2>
          </div>

          <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm transform hover:scale-[1.02] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="relative overflow-hidden">
                <Image
                  src={featuredPost.image || "/placeholder.svg"}
                  alt={featuredPost.title}
                  width={800}
                  height={400}
                  className="w-full h-64 lg:h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 font-bold animate-pulse">
                    <Star className="w-4 h-4 mr-1" />
                    DESTACADO
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/50 text-white px-3 py-1 backdrop-blur-sm">{featuredPost.category}</Badge>
                </div>
              </div>

              <div className="p-8 flex flex-col justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                    {featuredPost.title}
                  </CardTitle>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">{featuredPost.excerpt}</p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {featuredPost.author}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {featuredPost.date}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {featuredPost.readTime}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 mr-1 text-red-500" />
                        {featuredPost.likes}
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-1 text-blue-500" />
                        {featuredPost.comments}
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1 text-green-500" />
                        {featuredPost.views}
                      </div>
                    </div>

                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300">
                      Leer Más
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Últimos{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Artículos
              </span>
            </h2>
            <p className="text-xl text-gray-600">Descubre las últimas noticias y actualizaciones de SafeRide</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <Card
                key={post.id}
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm transform hover:scale-105 hover:-translate-y-2 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative overflow-hidden">
                  <Image
                    src={post.image || "/placeholder.svg"}
                    alt={post.title}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-black/50 text-white px-3 py-1 backdrop-blur-sm">{post.category}</Badge>
                  </div>
                  <div className="absolute top-4 left-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-2"
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 leading-tight line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {post.author}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    <div className="text-gray-400">{post.date}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Heart className="h-3 w-3 mr-1 text-red-500" />
                        {post.likes}
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1 text-blue-500" />
                        {post.comments}
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1 text-green-500" />
                        {post.views}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 text-xs"
                    >
                      Leer
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 bg-transparent"
            >
              Cargar Más Artículos
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-pulse">¡No te pierdas nada!</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Suscríbete a nuestro newsletter y recibe las últimas noticias, actualizaciones y consejos de SafeRide
            directamente en tu correo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
            <Input
              placeholder="Tu correo electrónico"
              className="flex-1 px-6 py-4 text-lg rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:border-white focus:bg-white/20"
            />
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Suscribirse
              <Zap className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <p className="text-sm text-blue-200 mt-4">
            * No spam, solo contenido de calidad. Puedes cancelar tu suscripción en cualquier momento.
          </p>
        </div>
      </section>
    </div>
  )
}
