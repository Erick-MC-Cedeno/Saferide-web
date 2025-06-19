"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export function MapDiagnostics() {
  const [diagnostics, setDiagnostics] = useState({
    googleMapsScript: false,
    googleMapsApi: false,
    geoapifyKey: false,
    geolocation: false,
  })

  useEffect(() => {
    const runDiagnostics = () => {
      // Verificar script de Google Maps
      const googleMapsScript = !!(typeof window !== "undefined" && window.google && window.google.maps)

      // Verificar API de Google Maps
      const googleMapsApi = !!(
        googleMapsScript &&
        window.google.maps.Map &&
        window.google.maps.Marker &&
        window.google.maps.DirectionsService
      )

      // Verificar clave de Geoapify
      const geoapifyKey = !!process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

      // Verificar geolocalización
      const geolocation = !!(typeof navigator !== "undefined" && navigator.geolocation)

      setDiagnostics({
        googleMapsScript,
        googleMapsApi,
        geoapifyKey,
        geolocation,
      })
    }

    runDiagnostics()

    // Verificar cada 2 segundos si Google Maps se carga
    const interval = setInterval(runDiagnostics, 2000)

    return () => clearInterval(interval)
  }, [])

  const DiagnosticItem = ({ label, status }: { label: string; status: boolean }) => (
    <div className="flex items-center justify-between p-2 border rounded">
      <span className="text-sm">{label}</span>
      {status ? (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          OK
        </Badge>
      ) : (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      )}
    </div>
  )

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <Card className="fixed bottom-4 left-4 w-80 z-50 bg-white/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          Diagnóstico de Mapas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <DiagnosticItem label="Google Maps Script" status={diagnostics.googleMapsScript} />
        <DiagnosticItem label="Google Maps API" status={diagnostics.googleMapsApi} />
        <DiagnosticItem label="Geoapify Key" status={diagnostics.geoapifyKey} />
        <DiagnosticItem label="Geolocalización" status={diagnostics.geolocation} />

        {!diagnostics.googleMapsScript && (
          <div className="text-xs text-red-600 p-2 bg-red-50 rounded">
            Verifica que NEXT_PUBLIC_GOOGLE_API_KEY esté configurada correctamente
          </div>
        )}

        {!diagnostics.geoapifyKey && (
          <div className="text-xs text-red-600 p-2 bg-red-50 rounded">
            Verifica que NEXT_PUBLIC_GEOAPIFY_API_KEY esté configurada correctamente
          </div>
        )}
      </CardContent>
    </Card>
  )
}
