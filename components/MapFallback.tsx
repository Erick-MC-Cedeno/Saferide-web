"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, RefreshCw, AlertTriangle, Wifi } from "lucide-react"

interface MapFallbackProps {
  error?: string
  onRetry?: () => void
  userType: "passenger" | "driver"
}

export function MapFallback({ error, onRetry, userType }: MapFallbackProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  return (
    <Card className="h-96">
      <CardContent className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          {error ? (
            <>
              <AlertTriangle className="h-16 w-16 text-red-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Error al cargar el mapa</h3>
                <p className="text-gray-500 mb-4 text-sm">{error}</p>
                <div className="space-y-3">
                  <Button onClick={handleRetry} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar
                  </Button>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>• Verifica tu conexión a internet</p>
                    <p>• Asegúrate de que las API keys estén configuradas</p>
                    <p>• Recarga la página si el problema persiste</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <MapPin className="h-16 w-16 text-blue-400 mx-auto" />
                <Wifi className="h-6 w-6 text-blue-600 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Cargando mapa...</h3>
                <p className="text-gray-500 mb-4">
                  {userType === "passenger"
                    ? "Preparando el mapa para encontrar tu ubicación"
                    : "Cargando mapa de conductor con solicitudes cercanas"}
                </p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <p className="text-xs text-gray-400 mt-3">Esto puede tomar unos segundos...</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
