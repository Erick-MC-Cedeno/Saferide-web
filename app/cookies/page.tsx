import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-start justify-center p-6">
      <div className="w-full max-w-6xl mt-12">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
          <CardHeader className="px-10 pt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-md bg-gradient-to-br from-purple-50 to-pink-50">
                  <Image src="/saferide-icon.svg" width={44} height={44} alt="SafeRide" />
                </div>
                <div>
                  <CardTitle className="text-2xl bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600">Política de Cookies</CardTitle>
                  <p className="text-sm text-gray-500">SafeRide — Última actualización: Octubre 2025</p>
                </div>
              </div>

              <div className="text-right">
                <Link href="/auth/support" className="text-sm text-pink-600 hover:underline">Contactar soporte</Link>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-10 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <main className="lg:col-span-3 space-y-6">
                <section className="prose max-w-none space-y-4">
                  <p className="text-gray-700">Esta Política de Cookies explica qué cookies utiliza SafeRide, por qué las usamos y cómo puedes gestionarlas. Las cookies nos ayudan a ofrecer una experiencia más rápida y personalizada.</p>
                </section>

                <article className="space-y-6">
                  <div id="que-son" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">1. ¿Qué son las cookies?</h3>
                    <p className="text-gray-700">Las cookies son pequeños archivos de texto que los sitios web o apps colocan en tu dispositivo para recordar información sobre tu visita, preferencias o configuración.</p>
                  </div>

                  <div id="por-que" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">2. ¿Por qué usamos cookies?</h3>
                    <p className="text-gray-700">Usamos cookies para mejorar el funcionamiento de la Plataforma: mantener sesiones activas, recordar preferencias, analizar uso de la app y detectar fraudes o abusos.</p>
                  </div>

                  <div id="tipos" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">3. Tipos de cookies que usamos</h3>
                    <ul className="list-disc list-inside text-gray-700 mt-2">
                      <li><strong>Necesarias:</strong> Esenciales para el funcionamiento de la Plataforma (p. ej. sesión y seguridad).</li>
                      <li><strong>De rendimiento:</strong> Nos ayudan a entender cómo se usa la app para mejorar la experiencia.</li>
                      <li><strong>Funcionales:</strong> Guardan preferencias del usuario para personalizar la interfaz.</li>
                      <li><strong>De análisis y terceros:</strong> Herramientas externas pueden colocar cookies para análisis o publicidad; su uso está descrito más abajo.</li>
                    </ul>
                  </div>

                  <div id="gestion" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">4. Cómo gestionar o desactivar cookies</h3>
                    <p className="text-gray-700">Puedes ajustar tus preferencias de cookies desde la configuración del navegador o del dispositivo. Ten en cuenta que desactivar cookies necesarias puede afectar la funcionalidad de la app.</p>
                  </div>

                  <div id="terceros" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">5. Cookies de terceros</h3>
                    <p className="text-gray-700">Algunas funcionalidades (por ejemplo servicios de mapas o análisis) pueden depender de proveedores externos que colocan cookies. Revisa las políticas de esos proveedores para más detalles.</p>
                  </div>

                  <div id="consentimiento" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">6. Consentimiento</h3>
                    <p className="text-gray-700">Al usar la app aceptas que utilicemos cookies según esta política, salvo las estrictamente necesarias que se usan siempre para el servicio básico. Puedes cambiar tus preferencias en cualquier momento.</p>
                  </div>

                  <div id="cambios" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">7. Cambios en la política</h3>
                    <p className="text-gray-700">Podemos actualizar esta política. Notificaremos cambios importantes mediante la app o por correo.</p>
                  </div>

                  <div className="mt-6 text-sm text-gray-500 italic">Si necesitas detalles sobre cookies específicas o deseas solicitar que no se utilicen tus datos para fines de análisis, contacta soporte.</div>
                </article>

                <footer className="pt-6 border-t border-gray-100 text-sm text-gray-500">
                  <p>SafeRide — Para más información sobre privacidad y condiciones revisa nuestras <Link href="/privacy" className="text-pink-600 hover:underline">Política de Privacidad</Link> y <Link href="/terms" className="text-pink-600 hover:underline">Términos de Servicio</Link>.</p>
                </footer>
              </main>

              <aside className="hidden lg:block lg:col-span-1">
                <div className="sticky top-28 space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-transparent">
                    <h4 className="text-sm font-semibold text-gray-700">Índice</h4>
                    <nav className="mt-3 text-sm space-y-2">
                      <a href="#que-son" className="block text-gray-600 hover:text-pink-700">1. ¿Qué son?</a>
                      <a href="#por-que" className="block text-gray-600 hover:text-pink-700">2. ¿Por qué?</a>
                      <a href="#tipos" className="block text-gray-600 hover:text-pink-700">3. Tipos</a>
                      <a href="#gestion" className="block text-gray-600 hover:text-pink-700">4. Gestión</a>
                      <a href="#terceros" className="block text-gray-600 hover:text-pink-700">5. Terceros</a>
                    </nav>
                  </div>

                  <div className="p-4 rounded-lg bg-white border">
                    <h5 className="text-sm font-semibold text-gray-700">Enlaces útiles</h5>
                    <ul className="mt-2 text-sm text-gray-600 space-y-2">
                      <li><Link href="/privacy" className="text-pink-600 hover:underline">Política de Privacidad</Link></li>
                      <li><Link href="/terms" className="text-pink-600 hover:underline">Términos de Servicio</Link></li>
                      <li><Link href="/auth/support" className="text-pink-600 hover:underline">Soporte</Link></li>
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
