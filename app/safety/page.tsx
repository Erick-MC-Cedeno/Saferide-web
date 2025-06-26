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
      color: "bg-blue-500",
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
      color: "bg-green-500",
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
      color: "bg-purple-500",
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
      color: "bg-red-500",
    },
  ]

  const securityMeasures = [
    {
      icon: Lock,
      title: "Datos Protegidos",
      description: "Tu información personal está segura con encriptación de nivel bancario",
    },
    {
      icon: Eye,
      title: "Monitoreo 24/7",
      description: "Centro de control que supervisa todos los viajes en tiempo real",
    },
    {
      icon: FileCheck,
      title: "Documentación Completa",
      description: "Todos los conductores y vehículos cuentan con documentación al día",
    },
    {
      icon: Smartphone,
      title: "App Segura",
      description: "Aplicación con múltiples capas de seguridad y autenticación",
    },
    {
      icon: Headphones,
      title: "Soporte Inmediato",
      description: "Equipo de soporte disponible 24/7 para cualquier emergencia",
    },
    {
      icon: Star,
      title: "Sistema de Calificaciones",
      description: "Califica y comenta cada viaje para mantener altos estándares",
    },
  ]

  const emergencySteps = [
    {
      step: "1",
      title: "Presiona el Botón de Emergencia",
      description: "Ubicado en la pantalla principal de la app",
      icon: AlertTriangle,
    },
    {
      step: "2",
      title: "Confirmación Automática",
      description: "El sistema detecta la emergencia y activa protocolos",
      icon: CheckCircle,
    },
    {
      step: "3",
      title: "Notificación Inmediata",
      description: "Se notifica a contactos de emergencia y autoridades",
      icon: Phone,
    },
    {
      step: "4",
      title: "Seguimiento Activo",
      description: "Monitoreo continuo hasta resolver la situación",
      icon: Eye,
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-6">
            <Shield className="w-4 h-4 mr-2" />
            Tu Seguridad es Nuestra Prioridad
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Seguridad SafeRide
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Conoce todas las medidas de seguridad que implementamos para garantizar que cada viaje sea seguro, confiable
            y tranquilo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              <Link href="/auth/register" className="flex items-center">
                Viajar Seguro Ahora
                <Shield className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              <Link href="/support">Reportar Incidente</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Safety Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Características de Seguridad</h2>
            <p className="text-lg text-gray-600">Múltiples capas de protección para tu tranquilidad</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {safetyFeatures.map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-xl ${feature.color} text-white mr-4`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">{feature.title}</CardTitle>
                      <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {feature.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        {detail}
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Medidas de Seguridad Adicionales</h2>
            <p className="text-lg text-gray-600">Protección integral en cada aspecto del servicio</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityMeasures.map((measure, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm text-center"
              >
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center mb-4">
                    <measure.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900">{measure.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm">{measure.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Protocol */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Protocolo de Emergencia</h2>
            <p className="text-lg text-gray-600">Pasos automáticos que se activan en caso de emergencia</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {emergencySteps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm text-center h-full">
                  <CardHeader className="pb-4">
                    <div className="relative">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center mb-4">
                        <step.icon className="h-8 w-8 text-white" />
                      </div>
                      <Badge className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center p-0">
                        {step.step}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </CardContent>
                </Card>
                {index < emergencySteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <div className="w-6 h-0.5 bg-gradient-to-r from-red-300 to-orange-300"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Tips */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Consejos de Seguridad</h2>
            <p className="text-lg text-gray-600">Recomendaciones para un viaje más seguro</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {safetyTips.map((tip, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-100 hover:shadow-md transition-all duration-300"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>
                <span className="text-sm text-gray-700">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-red-600 to-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <AlertTriangle className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">¿Necesitas Ayuda Inmediata?</h2>
            <p className="text-xl text-red-100 mb-8">
              Nuestro equipo de seguridad está disponible 24/7 para cualquier emergencia
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100">
                <Phone className="mr-2 h-5 w-5" />
                Llamar Emergencia: 911
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-600">
                <Link href="/support" className="flex items-center">
                  Contactar Soporte SafeRide
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
