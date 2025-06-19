import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Car,
  Shield,
  Users,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  MapPin,
  Smartphone,
  CreditCard,
  Award,
} from "lucide-react"
import Link from "next/link"
import { DevelopmentNotice } from "@/components/DevelopmentNotice"

export default function HomePage() {
  const features = [
    {
      icon: Shield,
      title: "Seguridad Garantizada",
      description: "Conductores verificados con antecedentes penales revisados y vehículos inspeccionados",
      color: "text-blue-600",
    },
    {
      icon: Clock,
      title: "Disponibilidad 24/7",
      description: "Servicio disponible las 24 horas del día, los 7 días de la semana en toda la ciudad",
      color: "text-green-600",
    },
    {
      icon: Star,
      title: "Calidad Premium",
      description: "Vehículos en excelente estado y conductores con calificaciones superiores a 4.8 estrellas",
      color: "text-yellow-600",
    },
    {
      icon: CreditCard,
      title: "Pagos Seguros",
      description: "Múltiples métodos de pago con tecnología de encriptación de nivel bancario",
      color: "text-purple-600",
    },
  ]

  const stats = [
    { number: "50K+", label: "Usuarios Activos" },
    { number: "10K+", label: "Conductores Verificados" },
    { number: "1M+", label: "Viajes Completados" },
    { number: "4.9", label: "Calificación Promedio" },
  ]

  const steps = [
    {
      step: "01",
      title: "Descarga la App",
      description: "Disponible en iOS y Android",
      icon: Smartphone,
    },
    {
      step: "02",
      title: "Ingresa tu Destino",
      description: "Selecciona tu ubicación y destino",
      icon: MapPin,
    },
    {
      step: "03",
      title: "Confirma tu Viaje",
      description: "Revisa los detalles y confirma",
      icon: CheckCircle,
    },
    {
      step: "04",
      title: "Disfruta el Viaje",
      description: "Viaja seguro y cómodo",
      icon: Car,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Development Notice */}
      <DevelopmentNotice />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
              🚀 Ahora disponible en toda la ciudad
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6">
              Viaja Seguro con{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                SafeRide
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              La plataforma de transporte más segura y confiable. Conectamos pasajeros con conductores verificados para
              viajes seguros, cómodos y confiables.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                asChild
                size="lg"
                className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
              >
                <Link href="/passenger/dashboard">
                  Solicitar Viaje
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-4 border-2 hover:bg-blue-50">
                <Link href="/driver/dashboard">
                  Conducir con SafeRide
                  <Car className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">¿Por qué elegir SafeRide?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ofrecemos la mejor experiencia de transporte con tecnología de punta y los más altos estándares de
              seguridad
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader className="text-center p-8">
                  <div className={`mx-auto mb-4 p-3 rounded-full bg-gray-50 w-fit`}>
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl mb-3">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600 leading-relaxed">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Cómo funciona</h2>
            <p className="text-xl text-gray-600">Solicitar un viaje es muy fácil</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {step.step}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <step.icon className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <Award className="h-16 w-16 text-blue-200 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-4">¿Listo para comenzar?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Únete a miles de usuarios que ya confían en SafeRide para sus viajes diarios
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-blue-50"
            >
              <Link href="/auth/register">
                Crear Cuenta Gratis
                <Users className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-blue-600"
            >
              <Link href="/auth/login">
                Iniciar Sesión
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold">SafeRide</span>
                  <div className="text-sm text-gray-400">Transporte Seguro</div>
                </div>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Conectamos personas de manera segura y confiable. Tu seguridad es nuestra prioridad.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    Acerca de
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-white transition-colors">
                    Carreras
                  </Link>
                </li>
                <li>
                  <Link href="/press" className="hover:text-white transition-colors">
                    Prensa
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white transition-colors">
                    Centro de Ayuda
                  </Link>
                </li>
                <li>
                  <Link href="/safety" className="hover:text-white transition-colors">
                    Seguridad
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Términos
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacidad
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SafeRide. Todos los derechos reservados. Viaja seguro, viaja con confianza.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
