"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Navigation, Car, Users } from "lucide-react"

interface SimpleMapPlaceholderProps {
  userType: "passenger" | "driver"
  pickupLocation?: { lat: number; lng: number }
  destinationLocation?: { lat: number; lng: number }
  driverLocations?: Array<{ id: string; lat: number; lng: number; name: string }>
}

export function SimpleMapPlaceholder({
  userType,
  pickupLocation,
  destinationLocation,
  driverLocations = [],
}: SimpleMapPlaceholderProps) {
  return (
    <Card className="h-96">
      <CardContent className="h-full p-0 relative overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative">
              <MapPin className="h-16 w-16 text-blue-600 mx-auto" />
              {userType === "driver" && <Car className="h-6 w-6 text-green-600 absolute -bottom-1 -right-1" />}
              {userType === "passenger" && <Users className="h-6 w-6 text-orange-600 absolute -bottom-1 -right-1" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {userType === "passenger" ? "Mapa de Pasajero" : "Mapa de Conductor"}
              </h3>
              <p className="text-gray-500 text-sm">
                {userType === "passenger"
                  ? "Aquí verías tu ubicación y la ruta a tu destino"
                  : "Aquí verías las solicitudes de viaje cercanas"}
              </p>
            </div>

            {/* Show location info if available */}
            {pickupLocation && (
              <div className="bg-white/80 p-3 rounded-lg text-left space-y-2 max-w-xs">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span>
                    Origen: {pickupLocation.lat.toFixed(4)}, {pickupLocation.lng.toFixed(4)}
                  </span>
                </div>
                {destinationLocation && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Navigation className="h-4 w-4 text-red-600" />
                    <span>
                      Destino: {destinationLocation.lat.toFixed(4)}, {destinationLocation.lng.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Show driver count for passengers */}
            {userType === "passenger" && driverLocations.length > 0 && (
              <div className="bg-white/80 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  {driverLocations.length} conductor{driverLocations.length !== 1 ? "es" : ""} cerca
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Corner indicators */}
        <div className="absolute top-4 left-4 bg-white/90 px-2 py-1 rounded text-xs text-gray-600">
          Vista previa del mapa
        </div>
      </CardContent>
    </Card>
  )
}
