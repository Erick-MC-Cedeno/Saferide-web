"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Headphones,
  MessageCircle,
  Phone,
  Mail,
  HelpCircle,
  Search,
  AlertCircle,
  Star,
  Users,
  CreditCard,
  Shield,
  Car,
  Smartphone,
  Send,
  Clock,
  CheckCircle,
  Sparkles,
  Heart,
  Zap,
  Globe,
} from "lucide-react"

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isVisible, setIsVisible] = useState(false)
  const [activeCard, setActiveCard] = useState<number | null>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const contactMethods = [
    {
      icon: MessageCircle,
      title: "Chat en Vivo",
      description: "Respuesta inmediata de nuestros agentes",
      availability: "24/7",
      responseTime: "< 2 minutos",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      action: "Iniciar Chat",
      pulse: true,
    },
    {
      icon: Phone,
      title: "Llamada Telefónica",
      description: "Habla directamente con un especialista",
      availability: "6:00 AM - 10:00 PM",
      responseTime: "Inmediato",
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      hoverColor: "hover:from-green-600 hover:to-emerald-700",
      action: "Llamar: +505 2222-3333",
      pulse: false,
    },
    {
      icon: Mail,
      title: "Correo Electrónico",
      description: "Para consultas detalladas y no urgentes",
      availability: "24/7",
      responseTime: "< 4 horas",
      color: "bg-gradient-to-br from-purple-500 to-violet-600",
      hoverColor: "hover:from-purple-600 hover:to-violet-700",
      action: "soporte@saferide.ni",
      pulse: false,
    },
    {
      icon: Smartphone,
      title: "WhatsApp",
      description: "Soporte rápido por mensaje",
      availability: "24/7",
      responseTime: "< 5 minutos",
      color: "bg-gradient-to-br from-green-600 to-green-700",
      hoverColor: "hover:from-green-700 hover:to-green-800",
      action: "+505 8888-9999",
      pulse: true,
    },
  ]

  const faqCategories = [
    { id: "all", name: "Todas", icon: HelpCircle, color: "bg-slate-500" },
    { id: "account", name: "Cuenta", icon: Users, color: "bg-blue-500" },
    { id: "rides", name: "Viajes", icon: Car, color: "bg-green-500" },
    { id: "payments", name: "Pagos", icon: CreditCard, color: "bg-orange-500" },
    { id: "safety", name: "Seguridad", icon: Shield, color: "bg-red-500" },
    { id: "app", name: "App", icon: Smartphone, color: "bg-purple-500" },
  ]

  const faqs = [
    {
      category: "account",
      question: "¿Cómo creo una cuenta en SafeRide?",
      answer:
        "Puedes crear tu cuenta descargando la app SafeRide y siguiendo estos pasos: 1) Ingresa tu número de teléfono, 2) Verifica el código SMS, 3) Completa tu perfil con nombre y foto, 4) Agrega un método de pago. ¡Listo para viajar!",
    },
    {
      category: "account",
      question: "¿Puedo cambiar mi información personal?",
      answer:
        "Sí, puedes actualizar tu información en cualquier momento desde la sección 'Perfil' en la app. Puedes cambiar tu nombre, foto, número de teléfono y métodos de pago.",
    },
    {
      category: "rides",
      question: "¿Cómo solicito un viaje?",
      answer:
        "Abre la app SafeRide, ingresa tu destino, selecciona tu plan de suscripción activo (Estándar, Plus o Premium), confirma la ubicación de recogida y presiona 'Solicitar viaje'. Te conectaremos con el conductor más cercano según tu plan suscrito.",
    },
    {
      category: "rides",
      question: "¿Puedo cancelar un viaje?",
      answer:
        "Sí, puedes cancelar un viaje antes de que llegue el conductor sin costo. Si cancelas después de que el conductor haya llegado o esté muy cerca, se aplicará una tarifa de cancelación de C$25.",
    },
    {
      category: "rides",
      question: "¿Qué hago si el conductor no llega?",
      answer:
        "Si el conductor no llega en el tiempo estimado, puedes contactarlo directamente desde la app o cancelar el viaje sin costo. Nuestro equipo de soporte también puede ayudarte a resolver la situación.",
    },
    {
      category: "payments",
      question: "¿Qué métodos de pago aceptan?",
      answer:
        "Aceptamos efectivo, tarjetas de crédito/débito (Visa, Mastercard), transferencias bancarias y billeteras digitales. También puedes pagar con saldo SafeRide que puedes recargar en la app.",
    },
    {
      category: "payments",
      question: "¿Cómo funcionan las tarifas?",
      answer:
        "Las tarifas se calculan basándose en la distancia, tiempo del viaje y demanda. Siempre verás el precio estimado antes de confirmar tu viaje. No hay tarifas ocultas.",
    },
    {
      category: "payments",
      question: "¿Puedo obtener una factura?",
      answer:
        "Sí, todas las facturas están disponibles en la sección 'Historial' de la app. También puedes solicitar facturas detalladas para uso empresarial contactando a soporte.",
    },
    {
      category: "safety",
      question: "¿Cómo verifican a los conductores?",
      answer:
        "Todos nuestros conductores pasan por un proceso riguroso: verificación de antecedentes penales, validación de licencia, examen médico, capacitación en seguridad y evaluación continua de desempeño.",
    },
    {
      category: "safety",
      question: "¿Qué hago en caso de emergencia?",
      answer:
        "Usa el botón de emergencia en la app que notificará automáticamente a tus contactos de emergencia y a nuestro centro de seguridad. También puedes llamar directamente al 911.",
    },
    {
      category: "safety",
      question: "¿Puedo compartir mi viaje?",
      answer:
        "Sí, puedes compartir tu viaje en tiempo real con familiares y amigos desde la app. Ellos podrán ver tu ubicación y ruta durante todo el trayecto.",
    },
    {
      category: "app",
      question: "¿La app funciona sin internet?",
      answer:
        "Necesitas conexión a internet para solicitar viajes y usar las funciones principales. Sin embargo, algunas funciones como ver tu historial funcionan offline.",
    },
    {
      category: "app",
      question: "¿Cómo actualizo la app?",
      answer:
        "Ve a Google Play Store (Android) o App Store (iOS), busca 'SafeRide' y presiona 'Actualizar'. Te recomendamos mantener siempre la última versión para mejor experiencia.",
    },
  ]

  const filteredFaqs =
    selectedCategory === "all"
      ? faqs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : faqs.filter(
          (faq) =>
            faq.category === selectedCategory &&
            (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              faq.answer.toLowerCase().includes(searchQuery.toLowerCase())),
        )

  const quickActions = [
    {
      icon: AlertCircle,
      title: "Reportar Problema",
      description: "Reporta un incidente o problema con tu viaje",
      color: "bg-gradient-to-br from-red-500 to-red-600",
      hoverColor: "hover:from-red-600 hover:to-red-700",
      iconColor: "text-red-500",
    },
    {
      icon: CreditCard,
      title: "Problema de Pago",
      description: "Ayuda con cobros o métodos de pago",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      hoverColor: "hover:from-orange-600 hover:to-orange-700",
      iconColor: "text-orange-500",
    },
    {
      icon: Car,
      title: "Objeto Perdido",
      description: "Recupera algo que olvidaste en el vehículo",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      iconColor: "text-blue-500",
    },
    {
      icon: Star,
      title: "Elogiar Conductor",
      description: "Reconoce el excelente servicio de un conductor",
      color: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      hoverColor: "hover:from-yellow-600 hover:to-yellow-700",
      iconColor: "text-yellow-500",
    },
  ]

  const stats = [
    { icon: Clock, value: "< 2 min", label: "Tiempo de respuesta", color: "text-blue-600" },
    { icon: CheckCircle, value: "99.9%", label: "Satisfacción", color: "text-green-600" },
    { icon: Globe, value: "24/7", label: "Disponibilidad", color: "text-purple-600" },
    { icon: Heart, value: "50K+", label: "Usuarios felices", color: "text-red-600" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-green-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-60 animate-bounce`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div
            className={`inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full text-purple-700 text-sm font-medium mb-8 transform transition-all duration-1000 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <Headphones className="w-5 h-5 mr-2 animate-pulse" />
            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
            Centro de Ayuda
          </div>

          <h1
            className={`text-4xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-8 transform transition-all duration-1000 delay-200 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            ¿Cómo podemos{" "}
            <span className="relative">
              ayudarte?
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transform scale-x-0 animate-pulse"></div>
            </span>
          </h1>

          <p
            className={`text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 transform transition-all duration-1000 delay-400 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            Encuentra respuestas rápidas a tus preguntas o contacta directamente con nuestro equipo de soporte.{" "}
            <span className="text-purple-600 font-semibold">Estamos aquí para ayudarte 24/7.</span>
          </p>

          {/* Stats Row */}
          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 transform transition-all duration-1000 delay-600 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
              >
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3 group-hover:animate-bounce`} />
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div
            className={`max-w-2xl mx-auto mb-8 transform transition-all duration-1000 delay-800 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6 group-hover:text-purple-500 transition-colors duration-300" />
              <Input
                type="text"
                placeholder="Busca tu pregunta aquí..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-6 py-6 text-lg border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-purple-500 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Contacta con{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Nosotros
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Elige el método que prefieras para obtener ayuda inmediata
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactMethods.map((method, index) => (
              <Card
                key={index}
                className={`hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm text-center group cursor-pointer transform hover:scale-105 hover:-translate-y-2 ${
                  isVisible ? "animate-fade-in-up" : ""
                }`}
                style={{ animationDelay: `${index * 200}ms` }}
                onMouseEnter={() => setActiveCard(index)}
                onMouseLeave={() => setActiveCard(null)}
              >
                <CardHeader className="pb-6">
                  <div
                    className={`w-20 h-20 mx-auto rounded-2xl ${method.color} ${method.hoverColor} flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 relative overflow-hidden`}
                  >
                    <method.icon className="h-10 w-10 text-white group-hover:animate-pulse" />
                    {method.pulse && <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping"></div>}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                    {method.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                    {method.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Disponible:</span>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 hover:bg-green-200 transition-colors duration-300"
                    >
                      {method.availability}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Respuesta:</span>
                    <Badge
                      variant="outline"
                      className="border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors duration-300"
                    >
                      {method.responseTime}
                    </Badge>
                  </div>
                  <Button
                    className={`w-full mt-6 ${method.color} ${method.hoverColor} text-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105`}
                  >
                    <Zap className="w-4 h-4 mr-2 group-hover:animate-spin" />
                    {method.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-white/80 to-purple-50/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Acciones{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Rápidas
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Resuelve problemas comunes con un solo clic</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm cursor-pointer group transform hover:scale-105 hover:-translate-y-2"
              >
                <CardHeader className="text-center pb-6">
                  <div className="relative mb-6">
                    <div
                      className={`w-16 h-16 mx-auto rounded-2xl ${action.color} ${action.hoverColor} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
                    >
                      <action.icon className="h-8 w-8 text-white group-hover:animate-bounce" />
                    </div>
                    <div
                      className={`absolute -top-2 -right-2 w-6 h-6 ${action.iconColor} bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:animate-ping`}
                    >
                      <Sparkles className="w-3 h-3" />
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                    {action.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Preguntas{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Frecuentes
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Encuentra respuestas a las preguntas más comunes de nuestros usuarios
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {faqCategories.map((category, index) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="lg"
                onClick={() => setSelectedCategory(category.id)}
                className={`transition-all duration-300 hover:scale-105 ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                    : "hover:bg-purple-50 hover:border-purple-300"
                }`}
              >
                <category.icon className="w-5 h-5 mr-2" />
                {category.name}
                {selectedCategory === category.id && <Sparkles className="w-4 h-4 ml-2 animate-spin" />}
              </Button>
            ))}
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-5xl mx-auto">
            <Accordion type="single" collapsible className="space-y-6">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-2 border-gray-100 rounded-2xl px-8 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-200 group"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-6 group-hover:text-purple-600 transition-colors duration-300">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-4 group-hover:animate-pulse"></div>
                      <span className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                        {faq.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-6 pl-6 leading-relaxed">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-16">
                <div className="relative mb-8">
                  <HelpCircle className="w-24 h-24 text-gray-300 mx-auto animate-pulse" />
                  <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-400/20 to-blue-400/20 animate-ping"></div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">No encontramos resultados</h3>
                <p className="text-lg text-gray-600 mb-8">
                  Intenta con otros términos de búsqueda o contacta directamente con soporte
                </p>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contactar Soporte
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-50/80 to-blue-50/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              ¿No encontraste lo que{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                buscabas?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Envíanos un mensaje detallado y nuestro equipo te responderá en menos de 4 horas
            </p>
          </div>

          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5"></div>
            <CardHeader className="relative">
              <CardTitle className="text-center text-2xl font-bold text-gray-900 flex items-center justify-center">
                <Mail className="w-6 h-6 mr-3 text-purple-600" />
                Formulario de Contacto
                <Sparkles className="w-5 h-5 ml-3 text-blue-600 animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Nombre Completo</label>
                  <Input
                    placeholder="Tu nombre completo"
                    className="border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 group-hover:border-purple-300 bg-white/80"
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Correo Electrónico</label>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    className="border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 group-hover:border-purple-300 bg-white/80"
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-3">Asunto</label>
                <Input
                  placeholder="¿En qué podemos ayudarte?"
                  className="border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 group-hover:border-purple-300 bg-white/80"
                />
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-3">Mensaje</label>
                <Textarea
                  placeholder="Describe tu consulta o problema en detalle. Mientras más información nos proporciones, mejor podremos ayudarte..."
                  rows={6}
                  className="border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 group-hover:border-purple-300 bg-white/80 resize-none"
                />
              </div>
              <Button className="w-full py-4 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-xl">
                <Send className="w-5 h-5 mr-3" />
                Enviar Mensaje
                <Zap className="w-4 h-4 ml-3 animate-pulse" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-red-600 via-red-500 to-orange-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20 shadow-2xl">
            <div className="relative mb-8">
              <AlertCircle className="w-20 h-20 text-white mx-auto animate-pulse" />
              <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-white/20 animate-ping"></div>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ¿Es una <span className="text-yellow-300 animate-pulse">Emergencia?</span>
            </h2>

            <p className="text-xl md:text-2xl text-red-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Para emergencias inmediatas, usa el botón de emergencia en la app o llama directamente.
              <span className="text-yellow-300 font-semibold"> Tu seguridad es nuestra prioridad.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                size="lg"
                className="bg-white text-red-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 py-4 px-8 text-lg rounded-xl"
              >
                <Phone className="mr-3 h-6 w-6 animate-pulse" />
                Emergencia: 911
                <Zap className="ml-3 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-red-600 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 py-4 px-8 text-lg rounded-xl bg-transparent"
              >
                <MessageCircle className="mr-3 h-6 w-6 animate-bounce" />
                Chat de Emergencia 24/7
                <AlertCircle className="ml-3 h-5 w-5 animate-pulse" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
