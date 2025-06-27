"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Phone,
  MapPin,
  UserCheck,
  Car,
  Lock,
  Eye,
  FileCheck,
  Smartphone,
  Headphones,
  Star,
  Sparkles,
  Zap,
} from "lucide-react"
import Link from "next/link"

export default function SafetyPage() {
  const safetyFeatures = [
    {
      icon: UserCheck,
      title: "Verificación de Conductores",
      description: "Proceso riguroso de selección y verificación",
      details: [
        "Verificación de antecedentes penales",
        "Validación de licencia de conducir",
        "Examen médico y psicológico",
        "Capacitación en seguridad vial",
        "Evaluación continua de desempeño",
      ],
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
    },
    {
      icon: Car,
      title: "Inspección Vehicular",
      description: "Vehículos seguros y en óptimas condiciones",
      details: [
        "Inspección técnica obligatoria",
        "Seguro de responsabilidad civil",
        "Mantenimiento preventivo regular",
        "Sistemas de seguridad actualizados",
        "Vehículos con menos de 10 años",
      ],
      color: "bg-gradient-to-br from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
    },
    {
      icon: MapPin,
      title: "Seguimiento GPS",
      description: "Monitoreo en tiempo real de todos los viajes",
      details: [
        "Ubicación exacta del vehículo",
        "Ruta optimizada y segura",
        "Compartir viaje con contactos",
        "Historial completo de rutas",
        "Alertas de desvío de ruta",
      ],
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
    },
    {
      icon: Phone,
      title: "Botón de Emergencia",
      description: "Ayuda inmediata cuando la necesites",
      details: [
        "Acceso directo a emergencias",
        "Notificación automática a contactos",
        "Conexión con autoridades locales",
        "Grabación automática de audio",
        "Ubicación enviada a servicios de emergencia",
      ],
      color: "bg-gradient-to-br from-red-500 to-red-600",
      hoverColor: "hover:from-red-600 hover:to-red-700",
    },
  ]

  const securityMeasures = [
    {
      icon: Lock,
      title: "Datos Protegidos",
      description: "Tu información personal está segura con encriptación de nivel bancario",
      gradient: "from-indigo-500 to-purple-600",
    },
    {
      icon: Eye,
      title: "Monitoreo 24/7",
      description: "Centro de control que supervisa todos los viajes en tiempo real",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      icon: FileCheck,
      title: "Documentación Completa",
      description: "Todos los conductores y vehículos cuentan con documentación al día",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      icon: Smartphone,
      title: "App Segura",
      description: "Aplicación con múltiples capas de seguridad y autenticación",
      gradient: "from-orange-500 to-red-600",
    },
    {
      icon: Headphones,
      title: "Soporte Inmediato",
      description: "Equipo de soporte disponible 24/7 para cualquier emergencia",
      gradient: "from-teal-500 to-blue-600",
    },
    {
      icon: Star,
      title: "Sistema de Calificaciones",
      description: "Califica y comenta cada viaje para mantener altos estándares",
      gradient: "from-yellow-500 to-orange-600",
    },
  ]

  const emergencySteps = [
    {
      step: "1",
      title: "Presiona el Botón de Emergencia",
      description: "Ubicado en la pantalla principal de la app",
      icon: AlertTriangle,
      color: "from-red-500 to-orange-500",
    },
    {
      step: "2",
      title: "Confirmación Automática",
      description: "El sistema detecta la emergencia y activa protocolos",
      icon: CheckCircle,
      color: "from-orange-500 to-yellow-500",
    },
    {
      step: "3",
      title: "Notificación Inmediata",
      description: "Se notifica a contactos de emergencia y autoridades",
      icon: Phone,
      color: "from-yellow-500 to-green-500",
    },
    {
      step: "4",
      title: "Seguimiento Activo",
      description: "Monitoreo continuo hasta resolver la situación",
      icon: Eye,
      color: "from-green-500 to-blue-500",
    },
  ]

  const safetyTips = [
    "Verifica que el conductor y vehículo coincidan con la app",
    "Comparte tu viaje con familiares o amigos",
    "Siéntate en el asiento trasero cuando viajes solo",
    "Mantén tu teléfono cargado y con datos activos",
    "Confía en tu instinto, si algo no se siente bien, cancela",
    "Usa el cinturón de seguridad en todo momento",
    "Evita compartir información personal innecesaria",
    "Califica y comenta cada viaje honestamente",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-ping delay-500"></div>
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-blue-400 rounded-full animate-ping delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-purple-400 rounded-full animate-ping delay-1500"></div>
        <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-indigo-400 rounded-full animate-ping delay-2000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-full text-green-700 text-sm font-medium mb-8 animate-bounce">
            <Shield className="w-5 h-5 mr-2 animate-pulse" />
            Tu Seguridad es Nuestra Prioridad
            <Sparkles className="w-4 h-4 ml-2 animate-spin" />
          </div>

          <h1 className="text-4xl md:text-7xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-8 animate-fade-in">
            <span className="inline-block animate-bounce delay-100">Seguridad</span>{" "}
            <span className="inline-block animate-bounce delay-200">SafeRide</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-10 animate-fade-in delay-300">
            Conoce todas las medidas de seguridad que implementamos para garantizar que cada viaje sea seguro, confiable
            y tranquilo.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in delay-500">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              <Link href="/auth/register" className="flex items-center">
                Viajar Seguro Ahora
                <Shield className="ml-2 h-5 w-5 group-hover:animate-spin" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group bg-transparent"
            >
              <Link href="/support" className="flex items-center">
                Reportar Incidente
                <AlertTriangle className="ml-2 h-5 w-5 group-hover:animate-bounce" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Safety Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-blue-700 text-sm font-medium mb-6 animate-pulse">
              <Zap className="w-4 h-4 mr-2" />
              Características Principales
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
              Características de Seguridad
            </h2>
            <p className="text-xl text-gray-600 animate-fade-in delay-200">
              Múltiples capas de protección para tu tranquilidad
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {safetyFeatures.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm hover:bg-white/95 transform hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardHeader className="pb-6">
                  <div className="flex items-center mb-6">
                    <div
                      className={`p-4 rounded-2xl ${feature.color} ${feature.hoverColor} text-white mr-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                    >
                      <feature.icon className="h-8 w-8 group-hover:animate-pulse" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 text-lg mt-2">{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {feature.details.map((detail, idx) => (
                      <div
                        key={idx}
                        className="flex items-center text-gray-700 group-hover:text-gray-800 transition-all duration-300 hover:translate-x-2"
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 mr-4 flex-shrink-0 group-hover:animate-pulse" />
                        <span className="text-base">{detail}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/60 backdrop-blur-sm relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full text-purple-700 text-sm font-medium mb-6 animate-bounce">
              <Lock className="w-4 h-4 mr-2 animate-pulse" />
              Protección Adicional
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
              Medidas de Seguridad Adicionales
            </h2>
            <p className="text-xl text-gray-600 animate-fade-in delay-200">
              Protección integral en cada aspecto del servicio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityMeasures.map((measure, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm text-center transform hover:-translate-y-3 hover:rotate-1 animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardHeader className="pb-6">
                  <div
                    className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r ${measure.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg`}
                  >
                    <measure.icon className="h-10 w-10 text-white group-hover:animate-bounce" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                    {measure.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                    {measure.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Protocol */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-100 to-orange-100 rounded-full text-red-700 text-sm font-medium mb-6 animate-pulse">
              <AlertTriangle className="w-4 h-4 mr-2 animate-bounce" />
              Protocolo de Emergencia
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
              Protocolo de Emergencia
            </h2>
            <p className="text-xl text-gray-600 animate-fade-in delay-200">
              Pasos automáticos que se activan en caso de emergencia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {emergencySteps.map((step, index) => (
              <div key={index} className="relative">
                <Card
                  className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm text-center h-full transform hover:-translate-y-4 animate-fade-in"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <CardHeader className="pb-6">
                    <div className="relative">
                      <div
                        className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}
                      >
                        <step.icon className="h-10 w-10 text-white group-hover:animate-pulse" />
                      </div>
                      <Badge className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center p-0 text-lg font-bold animate-bounce group-hover:animate-spin">
                        {step.step}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
                {index < emergencySteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-1 bg-gradient-to-r from-red-300 to-orange-300 rounded-full animate-pulse"></div>
                    <div className="absolute -right-1 -top-1 w-3 h-3 bg-gradient-to-r from-orange-400 to-red-400 rounded-full animate-ping"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Tips */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/60 backdrop-blur-sm relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-teal-100 rounded-full text-green-700 text-sm font-medium mb-6 animate-bounce">
              <Star className="w-4 h-4 mr-2 animate-spin" />
              Consejos Importantes
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fade-in">Consejos de Seguridad</h2>
            <p className="text-xl text-gray-600 animate-fade-in delay-200">Recomendaciones para un viaje más seguro</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {safetyTips.map((tip, index) => (
              <div
                key={index}
                className="group flex items-start space-x-4 p-6 rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-100 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-400 flex items-center justify-center flex-shrink-0 mt-1 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg">
                  <span className="text-white text-sm font-bold group-hover:animate-pulse">{index + 1}</span>
                </div>
                <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-300 font-medium">
                  {tip}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/5 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 border border-white/20 shadow-2xl animate-fade-in">
            <div className="relative mb-8">
              <AlertTriangle className="w-20 h-20 text-white mx-auto animate-bounce" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-white rounded-full animate-ping delay-500"></div>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-fade-in delay-200">
              ¿Necesitas Ayuda Inmediata?
            </h2>

            <p className="text-xl md:text-2xl text-red-100 mb-10 animate-fade-in delay-300">
              Nuestro equipo de seguridad está disponible 24/7 para cualquier emergencia
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in delay-500">
              <Button
                size="lg"
                className="bg-white text-red-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl group text-lg px-8 py-4"
              >
                <Phone className="mr-3 h-6 w-6 group-hover:animate-bounce" />
                Llamar Emergencia: 911
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-red-600 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl group text-lg px-8 py-4 bg-transparent"
              >
                <Link href="/support" className="flex items-center">
                  Contactar Soporte SafeRide
                  <Headphones className="ml-3 h-6 w-6 group-hover:animate-pulse" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
