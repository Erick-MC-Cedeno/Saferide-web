import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
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
                  <CardTitle className="text-2xl bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600">Términos de Servicio</CardTitle>
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
              {/* Main content */}
              <main className="lg:col-span-3 space-y-6">
                <section className="prose max-w-none space-y-4">
                  <p className="text-gray-700">Estos Términos regulan el uso de la Plataforma SafeRide. Lee con atención; su aceptación es necesaria para usar nuestros servicios.</p>
                </section>

                <article className="space-y-6">
                  <div id="aceptacion" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">1. Aceptación de los términos</h3>
                    <p className="text-gray-700">Al registrarte y usar la Plataforma aceptas estos Términos. Si no estás de acuerdo, no utilices SafeRide.</p>
                  </div>

                  <div id="servicio" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">2. Descripción del servicio</h3>
                    <p className="text-gray-700">SafeRide proporciona una plataforma para conectar pasajeros y conductores. No somos proveedores directos del transporte; los conductores son terceros independientes.</p>
                  </div>

                  <div id="cuentas" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">3. Registro y cuentas</h3>
                    <p className="text-gray-700">Proporciona datos veraces y protege tus credenciales. Las cuentas compartidas o el uso indebido pueden llevar a suspensión.</p>
                  </div>

                  <div id="uso" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">4. Uso aceptable</h3>
                    <ul className="list-disc list-inside text-gray-700 mt-2">
                      <li>No utilizar la Plataforma para actividades ilegales o dañinas.</li>
                      <li>No interferir con la operación de SafeRide ni intentar explotar vulnerabilidades.</li>
                      <li>Tratar con respeto a otros usuarios; no se tolera acoso o discriminación.</li>
                    </ul>
                  </div>

                  <div id="pagos" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">5. Pagos y tarifas</h3>
                    <p className="text-gray-700">Los términos de pago y tarifas se muestran al solicitar un servicio. SafeRide facilita el procesamiento, pero puede aplicar comisiones según se indique.</p>
                  </div>

                  <div id="responsabilidades" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">6. Responsabilidades</h3>
                    <p className="text-gray-700">SafeRide no garantiza la conducta de conductores. Cada usuario es responsable de su actuación y cumplimiento de la ley.</p>
                  </div>

                  <div id="cancelaciones" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">7. Cancelaciones y reembolsos</h3>
                    <p className="text-gray-700">Las políticas de cancelación son visibles en la app. En disputas seguiremos el proceso de resolución y soporte establecido.</p>
                  </div>

                  <div id="modificaciones" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">8. Modificaciones</h3>
                    <p className="text-gray-700">Podemos actualizar estos Términos. Avisaremos cambios relevantes; el uso continuado implica aceptación de la versión actual.</p>
                  </div>

                  <div id="contacto" className="border-l-4 border-pink-100 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800">9. Contacto</h3>
                    <p className="text-gray-700">Para dudas o reclamaciones usa la sección de soporte en la aplicación.</p>
                  </div>

                  <div className="mt-6 text-sm text-gray-500 italic">Estos Términos resumen obligaciones y derechos básicos. Para información legal detallada, contáctanos.</div>
                </article>

                <footer className="pt-6 border-t border-gray-100 text-sm text-gray-500">
                  <p>SafeRide — Derechos reservados. Consulta la Política de Privacidad para información sobre tratamiento de datos.</p>
                </footer>
              </main>

              {/* Aside: Índice y enlaces útiles */}
              <aside className="hidden lg:block lg:col-span-1">
                <div className="sticky top-28 space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-transparent">
                    <h4 className="text-sm font-semibold text-gray-700">Índice</h4>
                    <nav className="mt-3 text-sm space-y-2">
                      <a href="#aceptacion" className="block text-gray-600 hover:text-pink-700">1. Aceptación</a>
                      <a href="#servicio" className="block text-gray-600 hover:text-pink-700">2. Descripción</a>
                      <a href="#cuentas" className="block text-gray-600 hover:text-pink-700">3. Registro</a>
                      <a href="#uso" className="block text-gray-600 hover:text-pink-700">4. Uso aceptable</a>
                      <a href="#pagos" className="block text-gray-600 hover:text-pink-700">5. Pagos</a>
                    </nav>
                  </div>

                  <div className="p-4 rounded-lg bg-white border">
                    <h5 className="text-sm font-semibold text-gray-700">Enlaces útiles</h5>
                    <ul className="mt-2 text-sm text-gray-600 space-y-2">
                      <li><Link href="/privacy" className="text-pink-600 hover:underline">Política de Privacidad</Link></li>
                      <li><Link href="/auth/forgot-password" className="text-pink-600 hover:underline">Recuperar contraseña</Link></li>
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
