import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-start justify-center p-6">
      <div className="w-full max-w-6xl mt-12">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
          <CardHeader className="px-10 pt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-md bg-gradient-to-br from-blue-50 to-cyan-50">
                  <Image src="/saferide-icon.svg" width={44} height={44} alt="SafeRide" />
                </div>
                <div>
                  <CardTitle className="text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-600">Política de Privacidad</CardTitle>
                  <p className="text-sm text-gray-500">SafeRide — Última actualización: Octubre 2025</p>
                </div>
              </div>
              <div className="text-right">
                <Link href="/auth/support" className="text-sm text-blue-600 hover:underline">Contactar soporte</Link>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-10 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main content */}
              <main className="lg:col-span-3 space-y-6">
                <section className="prose max-w-none space-y-4">
                  <p className="text-gray-700">En SafeRide protegemos tus datos y trabajamos para que tu experiencia sea segura y transparente. A continuación describimos qué datos recopilamos, por qué los usamos y qué derechos tienes como usuario.</p>
                </section>

                <article className="space-y-6">
                  <div className="border-l-4 border-cyan-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">1. Información que recopilamos</h3>
                    <p className="text-gray-700">Recopilamos información que nos proporcionas directamente (nombre, correo, teléfono), información del vehículo para conductores y datos técnicos como identificadores de dispositivo, registros de uso y, cuando sea necesario para prestar el servicio, ubicación en tiempo real.</p>
                  </div>

                  <div className="border-l-4 border-cyan-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">2. Cómo usamos la información</h3>
                    <p className="text-gray-700">Utilizamos los datos para: operar la Plataforma (emparejamiento, pagos, notificaciones), comunicarnos contigo, prevenir fraudes, y mejorar la experiencia mediante análisis agregados.</p>
                  </div>

                  <div className="border-l-4 border-cyan-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">3. Compartir información</h3>
                    <p className="text-gray-700">Compartimos datos con conductores y proveedores esenciales (procesadores de pagos, servicios de mapas, almacenamiento). No vendemos información personal con fines comerciales.</p>
                  </div>

                  <div className="border-l-4 border-cyan-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">4. Seguridad y medidas</h3>
                    <p className="text-gray-700">Aplicamos controles técnicos y organizativos razonables: cifrado en tránsito, accesos restringidos, monitoreo de incidentes y revisiones periódicas. Aun así, ninguna medida es infalible; notifícanos cualquier sospecha de incumplimiento.</p>
                  </div>

                  <div className="border-l-4 border-cyan-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">5. Derechos de los usuarios</h3>
                    <p className="text-gray-700">Puedes solicitar acceder, rectificar, limitar el tratamiento o eliminar tus datos. Para ello, usa la sección de soporte dentro de la app o envía tu solicitud por el canal indicado en la app.</p>
                  </div>

                  <div className="border-l-4 border-cyan-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">6. Conservación</h3>
                    <p className="text-gray-700">Guardamos los datos mientras la cuenta exista o según obligaciones legales. Podemos retener registros mínimos por motivos de seguridad o cumplimiento, o conservar información anonimizada para análisis.</p>
                  </div>

                  <div className="border-l-4 border-cyan-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">7. Cambios en esta política</h3>
                    <p className="text-gray-700">Actualizaremos esta política cuando sea necesario. Notificaremos cambios relevantes mediante la app o correo. El uso continuado implica aceptación de la versión vigente.</p>
                  </div>

                  <div className="mt-6 text-sm text-gray-500">
                    <p className="italic">Nota: Esta política explica de forma general cómo tratamos datos. Para detalles específicos sobre subprocesadores o plazos de retención, contáctanos.</p>
                  </div>
                </article>

                <footer className="pt-6 border-t border-gray-100 text-sm text-gray-500">
                  <p>SafeRide — Dirección legal y datos de contacto disponibles en la app. Si necesitas asistencia, visita la sección de soporte.</p>
                </footer>
              </main>

              {/* Aside: Índice y enlaces útiles */}
              <aside className="hidden lg:block lg:col-span-1">
                <div className="sticky top-28 space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-transparent">
                    <h4 className="text-sm font-semibold text-gray-700">Índice</h4>
                    <nav className="mt-3 text-sm space-y-2">
                      <a href="#info" className="block text-gray-600 hover:text-cyan-700">1. Información que recopilamos</a>
                      <a href="#uso" className="block text-gray-600 hover:text-cyan-700">2. Cómo usamos la información</a>
                      <a href="#compartir" className="block text-gray-600 hover:text-cyan-700">3. Compartir información</a>
                      <a href="#seguridad" className="block text-gray-600 hover:text-cyan-700">4. Seguridad</a>
                      <a href="#derechos" className="block text-gray-600 hover:text-cyan-700">5. Derechos</a>
                    </nav>
                  </div>

                  <div className="p-4 rounded-lg bg-white border">
                    <h5 className="text-sm font-semibold text-gray-700">Enlaces útiles</h5>
                    <ul className="mt-2 text-sm text-gray-600 space-y-2">
                      <li><Link href="/terms" className="text-cyan-600 hover:underline">Términos de Servicio</Link></li>
                      <li><Link href="/auth/forgot-password" className="text-cyan-600 hover:underline">Recuperar contraseña</Link></li>
                      <li><Link href="/auth/support" className="text-cyan-600 hover:underline">Soporte</Link></li>
                    </ul>
                  </div>
                </div>
              </aside>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
