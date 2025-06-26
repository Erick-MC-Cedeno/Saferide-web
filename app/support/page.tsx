"use client"

import { useState } from "react"
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
} from "lucide-react"

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const contactMethods = [
    {
      icon: MessageCircle,
      title: "Chat en Vivo",
      description: "Respuesta inmediata de nuestros agentes",
      availability: "24/7",
      responseTime: "< 2 minutos",
      color: "bg-blue-500",
      action: "Iniciar Chat",
    },
    {
      icon: Phone,
      title: "Llamada Telefónica",
      description: "Habla directamente con un especialista",
      availability: "6:00 AM - 10:00 PM",
      responseTime: "Inmediato",
      color: "bg-green-500",
      action: "Llamar: +505 2222-3333",
    },
    {
      icon: Mail,
      title: "Correo Electrónico",
      description: "Para consultas detalladas y no urgentes",
      availability: "24/7",
      responseTime: "< 4 horas",
      color: "bg-purple-500",
      action: "soporte@saferide.ni",
    },
    {
      icon: Smartphone,
      title: "WhatsApp",
      description: "Soporte rápido por mensaje",
      availability: "24/7",
      responseTime: "< 5 minutos",
      color: "bg-green-600",
      action: "+505 8888-9999",
    },
  ]

  const faqCategories = [
    { id: "all", name: "Todas", icon: HelpCircle },
    { id: "account", name: "Cuenta", icon: Users },
    { id: "rides", name: "Viajes", icon: Car },
    { id: "payments", name: "Pagos", icon: CreditCard },
    { id: "safety", name: "Seguridad", icon: Shield },
    { id: "app", name: "App", icon: Smartphone },
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
        "Abrir la app, ingresa tu destino, selecciona el tipo de servicio (Estándar, Express, Premium, etc.), confirma la ubicación de recogida y presiona 'Solicitar viaje'. Te conectaremos con el conductor más cercano.",
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
      color: "bg-red-500",
    },
    {
      icon: CreditCard,
      title: "Problema de Pago",
      description: "Ayuda con cobros o métodos de pago",
      color: "bg-orange-500",
    },
    {
      icon: Car,
      title: "Objeto Perdido",
      description: "Recupera algo que olvidaste en el vehículo",
      color: "bg-blue-500",
    },
    {
      icon: Star,
      title: "Elogiar Conductor",
      description: "Reconoce el excelente servicio de un conductor",
      color: "bg-green-500",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-6">
            <Headphones className="w-4 h-4 mr-2" />
            Centro de Ayuda
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            ¿Cómo podemos ayudarte?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Encuentra respuestas rápidas a tus preguntas o contacta directamente con nuestro equipo de soporte. Estamos
            aquí para ayudarte 24/7.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Busca tu pregunta aquí..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Contacta con Nosotros</h2>
            <p className="text-lg text-gray-600">Elige el método que prefieras para obtener ayuda</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <Card
                key={index}
                className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm text-center"
              >
                <CardHeader className="pb-4">
                  <div
                    className={`w-16 h-16 mx-auto rounded-full ${method.color} flex items-center justify-center mb-4`}
                  >
                    <method.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900">{method.title}</CardTitle>
                  <CardDescription className="text-gray-600">{method.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Disponible:</span>
                    <Badge variant="secondary">{method.availability}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Respuesta:</span>
                    <Badge variant="outline">{method.responseTime}</Badge>
                  </div>
                  <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    {method.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
            <p className="text-lg text-gray-600">Resuelve problemas comunes con un clic</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer"
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-12 h-12 mx-auto rounded-full ${action.color} flex items-center justify-center mb-3`}
                  >
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-base font-bold text-gray-900">{action.title}</CardTitle>
                  <CardDescription className="text-sm text-gray-600">{action.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Preguntas Frecuentes</h2>
            <p className="text-lg text-gray-600">Encuentra respuestas a las preguntas más comunes</p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {faqCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                <category.icon className="w-4 h-4 mr-2" />
                {category.name}
              </Button>
            ))}
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-gray-200 rounded-lg px-6 bg-white/80 backdrop-blur-sm"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-gray-900">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-4">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No encontramos resultados</h3>
                <p className="text-gray-600">
                  Intenta con otros términos de búsqueda o contacta directamente con soporte
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">¿No encontraste lo que buscabas?</h2>
            <p className="text-lg text-gray-600">Envíanos un mensaje y te responderemos pronto</p>
          </div>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-center text-xl font-bold text-gray-900">Formulario de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <Input placeholder="Tu nombre completo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <Input type="email" placeholder="tu@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asunto</label>
                <Input placeholder="¿En qué podemos ayudarte?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
                <Textarea placeholder="Describe tu consulta o problema en detalle..." rows={5} />
              </div>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Send className="w-4 h-4 mr-2" />
                Enviar Mensaje
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-red-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <AlertCircle className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">¿Es una Emergencia?</h2>
            <p className="text-xl text-red-100 mb-8">
              Para emergencias inmediatas, usa el botón de emergencia en la app o llama directamente
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100">
                <Phone className="mr-2 h-5 w-5" />
                Emergencia: 911
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-600">
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat de Emergencia 24/7
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
